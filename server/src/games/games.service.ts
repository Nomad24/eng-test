import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Round } from '../models/round.model';
import { Score } from '../models/score.model';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Round)
    private roundModel: typeof Round,
    @InjectModel(Score)
    private scoreModel: typeof Score,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async getAllRoundsWithStatus(): Promise<any[]> {
    const rounds = await this.roundModel.findAll();
    return rounds.map(round => {
      const status = this.getRoundStatus(round);
      return {
        ...round.toJSON(),
        status
      };
    });
  }

  async getRoundByUuid(uuid: string): Promise<Round | null> {
    return this.roundModel.findByPk(uuid);
  }

  async getScoreByUserAndRound(userId: string, roundUuid: string): Promise<Score | null> {
    return this.scoreModel.findOne({
      where: {
        user: userId,
        round: roundUuid,
      },
    });
  }

  async getOrCreateScoreByUserAndRound(userId: string, roundUuid: string): Promise<Score> {

    const [scoreRecord] = await this.scoreModel.findOrCreate({
      where: {
        user: userId,
        round: roundUuid,
      },
      defaults: {
        user: userId,
        round: roundUuid,
        taps: 0,
      },
    });
    return scoreRecord;
  }

  async createRound(): Promise<Round> {
    const now = new Date();
    const cooldownDuration = parseInt(process.env.COOLDOWN_DURATION || '60') * 1000; // Convert to milliseconds
    const roundDuration = parseInt(process.env.ROUND_DURATION || '300') * 1000; // Convert to milliseconds

    const startDatetime = new Date(now.getTime() + cooldownDuration);
    const endDatetime = new Date(now.getTime() + cooldownDuration + roundDuration);

    const round = await this.roundModel.create({
      uuid: uuidv4(),
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      status: 'scheduled',
    });

    return round;
  }

  scoreFromTapsCount(taps: number) {
    // 1 тап = 1 очко, каждый 11-й тап дает 10 очков (вместо 1)
    // Для 11 тапов: 10 * 1 + 1 * 10 = 20 очков
    const regularPoints = taps;
    const bonusPoints = Math.floor(taps / 11) * 9; // +9 к базовому 1 за каждый 11-й
    return regularPoints + bonusPoints;
  }

  async processTap(userId: string, roundUuid: string, role: string): Promise<{ score: number }> {
    // Получаем раунд и проверяем что он активен
    const round = await this.roundModel.findByPk(roundUuid);
    if (!round) {
      throw new Error('Round not found');
    }
    
    if (!this.isRoundActive(round)) {
      throw new Error('Round is not active');
    }

    if (role != 'nikita') {
      // Обновить запись в таблице score
      await this.scoreModel.increment('taps', {
        by: 1,
        where: {
          user: userId,
          round: roundUuid,
        },
      });
    }

    const scoreRecord = await this.scoreModel.findOne({
      where: {
        user: userId,
        round: roundUuid,
      },
    });
    const score = this.scoreFromTapsCount(scoreRecord.taps);

    return { score };
  }

  async getRoundSummary(roundUuid: string): Promise<{
    totalScore: number;
    bestPlayer: { username: string; score: number } | null;
  }> {
    // Получаем все счета для раунда с информацией о пользователях
    const scores = await this.scoreModel.findAll({
      where: {
        round: roundUuid,
      },
      include: [
        {
          model: this.userModel,
          as: 'userRef',
          attributes: ['login'],
        },
      ],
    });

    // Суммируем все счета
    const totalScore = scores.reduce((sum, score) => sum + this.scoreFromTapsCount(score.taps), 0);

    // Находим лучшего игрока
    let bestPlayer: { username: string; score: number } | null = null;
    if (scores.length > 0) {
      const bestScore = scores.reduce((max, score) => { 
        const scorePoints = this.scoreFromTapsCount(score.taps);
        const maxPoints = this.scoreFromTapsCount(max.taps);
        return scorePoints > maxPoints ? score : max;  
      });

      bestPlayer = {
        username: bestScore.userRef.login,
        score: this.scoreFromTapsCount(bestScore.taps),
      };
    }

    return {
      totalScore,
      bestPlayer,
    };
  }

  isRoundActive(round: Round): boolean {
    const now = new Date();
    return now >= round.start_datetime && now <= round.end_datetime;
  }

  isRoundFinished(round: Round): boolean {
    const now = new Date();
    return now >= round.end_datetime;
  }

  getRoundStatus(round: Round): 'scheduled' | 'active' | 'completed' {
    const now = new Date();
    if (now < round.start_datetime) {
      return 'scheduled';
    } else if (now >= round.start_datetime && now < round.end_datetime) {
      return 'active';
    } else {
      return 'completed';
    }
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CharacterCard } from './character-card.entity';

/**
 * 角色卡点赞记录
 */
@Entity('character_card_likes')
@Unique(['userId', 'characterCardId'])
@Index(['userId'])
@Index(['characterCardId'])
export class CharacterCardLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @Column({
    name: 'character_card_id',
    type: 'int',
    comment: '角色卡ID',
  })
  characterCardId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CharacterCard)
  @JoinColumn({ name: 'character_card_id' })
  characterCard: CharacterCard;
}

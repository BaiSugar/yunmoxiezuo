import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TokenBalancesService } from '../../token-balances/services/token-balances.service';
import { UsersService } from '../../users/users.service';
import { DataSource } from 'typeorm';
import { UserTokenBalance } from '../../token-balances/entities/user-token-balance.entity';

/**
 * 初始化老用户的字数余额
 * 为没有余额记录的用户创建并赠送初始额度
 * 
 * 使用方法：
 * npm run script:init-balances
 */
async function initUserBalances() {
  console.log('🚀 开始初始化用户字数余额...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const tokenBalancesService = app.get(TokenBalancesService);
  const dataSource = app.get(DataSource);

  try {
    // 1. 获取所有用户
    const users = await usersService.findAll({
      page: 1,
      pageSize: 10000, // 假设用户总数不超过1万
    });

    console.log(`📊 找到 ${users.items.length} 个用户\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. 遍历所有用户，检查是否已赠送初始额度
    for (const user of users.items) {
      try {
        // 检查是否已有赠送记录（防止重复赠送）
        const hasGiftTransaction = await dataSource
          .query(
            `SELECT id FROM token_transactions 
             WHERE user_id = ? 
               AND type = 'GIFT' 
               AND source IN ('register_gift', 'auto_init', 'system_migration')
             LIMIT 1`,
            [user.id]
          );

        if (hasGiftTransaction && hasGiftTransaction.length > 0) {
          // 已经赠送过，只检查每日免费额度
          const existingBalance = await dataSource
            .getRepository(UserTokenBalance)
            .findOne({ where: { userId: user.id } });

          if (existingBalance && (!existingBalance.dailyFreeQuota || existingBalance.dailyFreeQuota === 0)) {
            console.log(`🔄 为用户 ${user.username} (ID: ${user.id}) 设置每日免费额度...`);
            await tokenBalancesService.setDailyQuota(user.id, 10000);
            console.log(`  ✅ 成功设置每日 1万免费额度\n`);
            createdCount++;
          } else {
            skippedCount++;
            if (skippedCount <= 5) {
              console.log(`⏭️  跳过用户 ${user.username} (ID: ${user.id}) - 已领取初始奖励`);
            }
          }
        } else {
          // 从未赠送过，执行完整初始化
          console.log(`✨ 为用户 ${user.username} (ID: ${user.id}) 补发初始奖励...`);

          // 确保有余额记录
          await tokenBalancesService.getOrCreateBalance(user.id);

          // 赠送50万字数
          await tokenBalancesService.recharge(
            user.id,
            500000,
            true,
            'system_migration',
            undefined,
            '系统迁移 - 老用户初始奖励',
          );

          // 设置每日免费1万字数
          await tokenBalancesService.setDailyQuota(user.id, 10000);

          createdCount++;
          console.log(`  ✅ 成功：赠送 50万字数 + 每日 1万免费额度\n`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ 处理用户 ${user.username} (ID: ${user.id}) 失败:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 执行结果汇总:');
    console.log(`  ✅ 成功处理: ${createdCount} 个用户`);
    console.log(`  ⏭️  跳过: ${skippedCount} 个用户（已有记录）`);
    console.log(`  ❌ 失败: ${errorCount} 个用户`);
    console.log('='.repeat(60));
    console.log('\n✨ 初始化完成！');
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// 执行脚本
initUserBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


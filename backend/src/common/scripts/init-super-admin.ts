import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { Role } from '../../users/entities/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as readline from 'readline';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  console.log('--- 创建超级管理员账户 ---');

  const email = await question('请输入管理员邮箱: ');
  if (!email) {
    console.error('邮箱不能为空！');
    await app.close();
    rl.close();
    return;
  }

  const password = await question('请输入管理员密码: ');
  if (!password) {
    console.error('密码不能为空！');
    await app.close();
    rl.close();
    return;
  }
  
  const username = email.split('@')[0]; // 默认使用邮箱前缀作为用户名

  // 检查用户是否已存在
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    console.error(`❌ 邮箱 ${email} 已被注册。`);
    await app.close();
    rl.close();
    return;
  }

  // 查找 super_admin 角色
  const superAdminRole = await roleRepository.findOne({ where: { code: 'super_admin' } });
  if (!superAdminRole) {
    console.error('❌ 未找到 "super_admin" 角色。请先确保角色已在数据库中创建。');
    await app.close();
    rl.close();
    return;
  }

  try {
    const createUserDto: CreateUserDto = {
      email,
      password,
      username,
      nickname: '管理员',
    };

    // 使用 UsersService 创建用户，密码会自动加密
    const user = await usersService.create(createUserDto);

    // 分配 super_admin 角色
    user.roles = [superAdminRole];
    await userRepository.save(user);

    console.log(`✅ 超级管理员账户创建成功！`);
    console.log(`   - 用户名: ${user.username}`);
    console.log(`   - 邮箱: ${user.email}`);

  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
  } finally {
    await app.close();
    rl.close();
  }
}

bootstrap();

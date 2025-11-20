import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenPackage } from './entities/token-package.entity';
import { TokenPackagesService } from './services/token-packages.service';
import { TokenPackagesController } from './controllers/token-packages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TokenPackage])],
  controllers: [TokenPackagesController],
  providers: [TokenPackagesService],
  exports: [TokenPackagesService],
})
export class TokenPackagesModule {}

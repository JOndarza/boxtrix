import { Module } from '@nestjs/common';
import { OrganizeModule } from './organize/organize.module';

@Module({
  imports: [OrganizeModule],
})
export class AppModule {}

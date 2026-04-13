import { Module } from '@nestjs/common';
import { OrganizeController } from './organize.controller';
import { OrganizeService } from './organize.service';
import { BINPACKINGJSService } from '@domain/services/algorithms/BINPACKINGJS/BINPACKINGJS.service';

@Module({
  controllers: [OrganizeController],
  providers: [OrganizeService, BINPACKINGJSService],
})
export class OrganizeModule {}

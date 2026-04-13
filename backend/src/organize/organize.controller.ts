import { Body, Controller, Post } from '@nestjs/common';
import { IInput } from '@domain/interfaces/structures/Input.interface';
import { IOutput } from '@domain/interfaces/structures/Output.interface';
import { OrganizeService } from './organize.service';

@Controller('organize')
export class OrganizeController {
  constructor(private readonly _organize: OrganizeService) {}

  @Post('sort')
  sort(@Body() input: IInput): IOutput {
    return this._organize.sort(input);
  }
}

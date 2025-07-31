import { Injectable } from '@nestjs/common';
import { Role } from './common/enums/role.enum';
import { Roles } from './common/decorators/roles.decorator';

@Injectable()
export class AppService {
  @Roles(Role.Admin)
  getHello(): string {
    return 'Hello World!';
  }
}

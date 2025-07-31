import { Controller, Get } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('cat')
export class CatController {
  @Get()
  findAll() {
    return 'This action returns all cats';
  }

  // test user roles
  @Roles(Role.User)
  @Get('test-user')
  findTest() {
    return 'This action returns a test response';
  }
}

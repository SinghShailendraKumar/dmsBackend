import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from '../models/dto/CreateUser.dto';
import { LoginUserDto } from '../models/dto/LoginUser.dto';
import { ValidateOTP } from '../models/dto/ValidateOTP.dto';
import { UserI } from '../models/user.interface';
import { UserService } from '../service/user.service';

@Controller('users')
export class UserController {

  constructor(private userService: UserService) { }

  // Rest Call: POST http://localhost:8080/api/users/
  @Post()
  async create(@Body() createdUserDto: CreateUserDto): Promise<Observable<UserI> >{
    return await this.userService.create(createdUserDto);
  }

  @Post('validateOTP')
  @HttpCode(200)
  async validateOTP(@Body() validateOTP: ValidateOTP): Promise<UserI> {
    return await this.userService.validateOTP(validateOTP);
  }

  // Rest Call: POST http://localhost:8080/api/users/login
  @Post('login')
  @HttpCode(200)
 async login(@Body() loginUserDto: LoginUserDto): Promise<Object> {
    const jwt = await  this.userService.login(loginUserDto)
    return {
          access_token: jwt,
          token_type: 'JWT',
          expires_in: 10000
        }
 
  }

  // Rest Call: GET http://localhost:8080/api/users/ 
  // Requires Valid JWT from Login Request
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() request): Promise<UserI[]> {
    return await this.userService.findAll();
  }
}

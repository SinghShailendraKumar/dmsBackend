import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../models/dto/CreateUser.dto';
import { LoginUserDto } from '../models/dto/LoginUser.dto';
import { ValidateOTP } from '../models/dto/ValidateOTP.dto';
import { UserEntity } from '../models/user.entity';
import { UserI } from '../models/user.interface';
import { RedisService } from 'src/redis/service/redis.service';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private authService: AuthService,
    private redisService: RedisService
  ) { }

  async create(createdUserDto: CreateUserDto): Promise<any> {
   
    
    const email = createdUserDto.email;
    console.log("email",email);
    const exists = await this.mailExists(email);
    console.log("exists",exists);
 
        if (!exists) {

          const otp = Math.floor(100000 + Math.random() * 900000);
           this.redisService.set(`OTP_${email.toLowerCase()}`,otp,60);
           this.redisService.set(`USER_${email.toLowerCase()}`,createdUserDto,60);
          const userI = {email,otp};
          return of(userI);
          
        } else {
          throw new HttpException('Email already in use', HttpStatus.CONFLICT);
        }
 
    
  }


  async validateOTP(validateOTPDto: ValidateOTP): Promise<UserI> {
    const email = validateOTPDto.email;
    const otp=validateOTPDto.otp;
    const saveuser =  await this.redisService.get(`USER_${email.toLowerCase()}`);
    const savedOTP =  await this.redisService.get(`OTP_${email.toLowerCase()}`);

    if(saveuser ==null || savedOTP ==null){
      throw new HttpException('Session Expired', HttpStatus.CONFLICT);
    }
    const createUserDto = new CreateUserDto ();
    Object.assign(createUserDto, saveuser);
  
   if(email!=createUserDto.email ||   savedOTP != otp){
    throw new HttpException('Session Expired', HttpStatus.CONFLICT);
   }
const userEntity = this.userRepository.create(createUserDto);
    const exists =  await this.mailExists(userEntity.email) ;
      
        if (!exists) {
          
          const passwordHash = await  this.authService.hashPassword(userEntity.password)
              // Overwrite the user password with the hash, to store it in the db
              userEntity.password = passwordHash;
              const savedUser =  await (this.userRepository.save(userEntity));
                  const { password, ...user } = savedUser;
                  return user;

        } else {
          throw new HttpException('Email already in use', HttpStatus.CONFLICT);
        }

  }


  /*login(loginUserDto: LoginUserDto): Observable<string> {
    return this.findUserByEmail(loginUserDto.email.toLowerCase()).pipe(
      switchMap((user: UserI) => {
        if (user) {
          return this.validatePassword(loginUserDto.password, user.password).pipe(
            switchMap((passwordsMatches: boolean) => {
              if (passwordsMatches) {
                return this.findOne(user.id).pipe(
                  switchMap((user: UserI) => this.authService.generateJwt(user))
                )
              } else {
                throw new HttpException('Login was not Successfulll', HttpStatus.UNAUTHORIZED);
              }
            })
          )
        } else {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
      }
      )
    )
  }*/




  async login(loginUserDto: LoginUserDto): Promise<string> {
    const user = await this.findUserByEmail(loginUserDto.email.toLowerCase());
    console.log(loginUserDto.password);
    console.log(user.id);
        if (user) {
  
          const passwordsMatches = await this.validatePassword(loginUserDto.password, user.password)
              if (passwordsMatches) {
              
                return await this.authService.generateJwt(user);
             
              } else {
                throw new HttpException('Login was not Successfulll', HttpStatus.UNAUTHORIZED);
              }

        } else {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

  }

  async findAll(): Promise<UserI[]> {
    return await (this.userRepository.find());
  }

  async findOne(id: number): Promise<UserI> {
    return await (this.userRepository.findOneBy({ id }));
  }

  private async findUserByEmail(email: string): Promise<UserI> {
    return await (this.userRepository.findOneBy({ email }));
  }

  private async validatePassword(password: string, storedPasswordHash: string): Promise<boolean> {
    return await this.authService.comparePasswords(password, storedPasswordHash);
  }

  private async  mailExists(email: string): Promise<boolean> {
    email = email.toLowerCase();
    const user = await (this.userRepository.findOneBy({ email }));
    if(user)
      return true;
    return false;
  }

}

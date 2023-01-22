import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable } from 'rxjs';
import { UserI } from 'src/user/models/user.interface';
var bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {

    constructor(private readonly jwtService: JwtService) {}

    async generateJwt(user: UserI): Promise<string> {
        user.password=null;
        return await (this.jwtService.signAsync({user}));
    }

    async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 12);
    }

    async comparePasswords(password: string, storedPasswordHash: string): Promise<any> {
        return await (bcrypt.compare(password, storedPasswordHash));
    }
}

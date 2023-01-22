import { IsEmail, IsNotEmpty } from "class-validator";

export class ValidateOTP {

    @IsEmail()
    email: string;

    @IsNotEmpty()
    otp: string;
}
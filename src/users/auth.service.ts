// auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt};
    const access_token = this.jwtService.sign(payload, { expiresIn: '1h'});
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' }); 
    return {
      access_token,
      refresh_token
    };
  }

  async register(userDto: CreateUserDto): Promise<User> {
    const existingUserByUsername = await this.usersRepository.findOneBy({ username: userDto.username });
    if (existingUserByUsername) {
      throw new BadRequestException('Username already exists');
    }

    const existingUserByEmail = await this.usersRepository.findOneBy({ email: userDto.email });
    if (existingUserByEmail) {
      
      throw new BadRequestException('Email already exists');
    }


    const user = this.usersRepository.create(userDto);
    return this.usersRepository.save(user);
  }
}
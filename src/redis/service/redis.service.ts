import { Injectable } from '@nestjs/common';
import * as Redis from 'redis';

@Injectable()
export class RedisService {
  private client: any;

  constructor() {
    this.client = Redis.createClient({
      url: 'redis://localhost:6379'
  });

     this.client.on('connect', () => {
        console.log('Redis connected');
    });

     this.client.on('error', (err) => {
        console.log(`Error: ${err}`);
    });
}

 async  set(key: string, value: any, expireTime: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.set(key, JSON.stringify(value), 'EX', expireTime, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }

 async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(JSON.parse(result));
      });
    });
  }

  delete(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }
}
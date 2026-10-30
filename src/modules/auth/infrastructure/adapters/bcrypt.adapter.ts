import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EnvironmentVariables } from '../../../../context/config/app.config';
import { HasherPort } from '../../domain/interfaces/hasher.port';

/** bcrypt implementation of the HasherPort. */
@Injectable()
export class BcryptAdapter implements HasherPort {
  private readonly saltRounds: number;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    this.saltRounds = configService.get('BCRYPT_SALT_ROUNDS', { infer: true });
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

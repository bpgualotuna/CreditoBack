import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export type CookieSameSite = 'lax' | 'strict' | 'none';

const DURATION_PATTERN = /^\d+(ms|s|m|h|d)?$/;

/**
 * Strictly validated environment variables. The application refuses to boot
 * when any required variable is missing or malformed.
 */
export class EnvironmentVariables {
  // --- Server ---
  @Transform(({ value }) => (value === undefined ? 3000 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  // --- Database (PostgreSQL / Supabase) ---
  @IsString()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL must be a valid postgresql:// connection string',
  })
  DATABASE_URL: string;

  // --- JWT ---
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
  JWT_SECRET: string;

  /** Optional dedicated secret for refresh tokens. Falls back to JWT_SECRET. */
  @IsOptional()
  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET?: string;

  @IsString()
  @Matches(DURATION_PATTERN, {
    message: 'JWT_EXPIRES_IN must look like 15m, 8h, 7d',
  })
  JWT_EXPIRES_IN: string = '8h';

  @IsString()
  @Matches(DURATION_PATTERN, {
    message: 'JWT_REFRESH_EXPIRES_IN must look like 15m, 8h, 7d',
  })
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // --- Security ---
  @Transform(({ value }) => (value === undefined ? 12 : Number(value)))
  @IsInt()
  @Min(10)
  @Max(15)
  BCRYPT_SALT_ROUNDS: number = 12;

  // --- CORS ---
  @IsString()
  @IsNotEmpty()
  FRONTEND_URLS: string;

  // --- Refresh token cookie ---
  @IsIn(['lax', 'strict', 'none'])
  COOKIE_SAMESITE: CookieSameSite = 'lax';

  @IsString()
  COOKIE_PATH: string = '/api/auth';

  @Transform(({ value }) =>
    value === undefined ? true : String(value).toLowerCase() === 'true',
  )
  @IsBoolean()
  COOKIE_PERSISTENT: boolean = true;
}

/**
 * Validation hook for `ConfigModule.forRoot({ validate })`.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return validated;
}

/** Parses the comma separated FRONTEND_URLS variable. */
export function parseOrigins(frontendUrls: string): string[] {
  return frontendUrls
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

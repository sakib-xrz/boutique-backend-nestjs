# NestJS Authentication System - বাংলা টিউটোরিয়াল 🇧🇩

## সম্পূর্ণ Authentication Flow তৈরির Step-by-Step গাইড

এই টিউটোরিয়ালে আমরা NestJS ব্যবহার করে একটি সম্পূর্ণ Authentication System তৈরি করব যেখানে থাকবে:
- ✅ User Registration (সাইন আপ)
- ✅ User Login (সাইন ইন)
- ✅ JWT Access Token & Refresh Token
- ✅ Token Refresh Mechanism
- ✅ User Logout
- ✅ Role-based Authorization (RBAC)
- ✅ Protected Routes
- ✅ Password Hashing (bcrypt)

---

## 📋 সূচিপত্র

1. [প্রজেক্ট সেটআপ](#1-প্রজেক্ট-সেটআপ)
2. [প্রয়োজনীয় প্যাকেজ ইনস্টল](#2-প্রয়োজনীয়-প্যাকেজ-ইনস্টল)
3. [Environment Configuration](#3-environment-configuration)
4. [Prisma সেটআপ ও Database Schema](#4-prisma-সেটআপ-ও-database-schema)
5. [Prisma Module তৈরি](#5-prisma-module-তৈরি)
6. [Users Module তৈরি](#6-users-module-তৈরি)
7. [Auth Module তৈরি](#7-auth-module-তৈরি)
8. [DTOs তৈরি](#8-dtos-তৈরি)
9. [Providers তৈরি](#9-providers-তৈরি)
10. [Guards তৈরি](#10-guards-তৈরি)
11. [Decorators তৈরি](#11-decorators-তৈরি)
12. [App Module কনফিগার](#12-app-module-কনফিগার)
13. [Main.ts কনফিগার](#13-maints-কনফিগার)
14. [Common Utilities](#14-common-utilities)
15. [API টেস্টিং](#15-api-টেস্টিং)

---

## 1. প্রজেক্ট সেটআপ

### NestJS CLI ইনস্টল করুন (যদি না থাকে)
```bash
npm install -g @nestjs/cli
```

### নতুন প্রজেক্ট তৈরি করুন
```bash
nest new my-auth-project
```

প্রশ্ন করলে `npm` বা `yarn` সিলেক্ট করুন। আমরা এখানে `yarn` ব্যবহার করব।

### প্রজেক্ট ডিরেক্টরিতে যান
```bash
cd my-auth-project
```

---

## 2. প্রয়োজনীয় প্যাকেজ ইনস্টল

### Main Dependencies
```bash
yarn add @nestjs/config @nestjs/jwt @nestjs/swagger @prisma/client @prisma/adapter-pg bcrypt class-transformer class-validator pg
```

### Dev Dependencies
```bash
yarn add -D prisma @types/bcrypt
```

### প্যাকেজগুলোর কাজ:
| প্যাকেজ | কাজ |
|---------|-----|
| `@nestjs/config` | Environment variables ম্যানেজ করতে |
| `@nestjs/jwt` | JWT টোকেন তৈরি ও verify করতে |
| `@nestjs/swagger` | API Documentation তৈরি করতে |
| `@prisma/client` | Database ORM |
| `bcrypt` | Password hashing করতে |
| `class-validator` | DTO validation করতে |
| `class-transformer` | Data transformation করতে |

---

## 3. Environment Configuration

### `.env` ফাইল তৈরি করুন (প্রজেক্টের root এ)
```env
# Server Configuration
PORT=8000
API_PREFIX=api/v1
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_TOKEN_TTL=3600
JWT_REFRESH_TOKEN_TTL=604800
JWT_TOKEN_AUDIENCE=localhost:8000
JWT_TOKEN_ISSUER=localhost:8000

# CORS
CORS_ORIGIN=http://localhost:3000
```

> ⚠️ **গুরুত্বপূর্ণ:** Production এ `JWT_SECRET` এবং `JWT_REFRESH_SECRET` অবশ্যই strong ও unique হতে হবে!

---

## 4. Prisma সেটআপ ও Database Schema

### Prisma Initialize করুন
```bash
npx prisma init
```

এটি `prisma` ফোল্ডার তৈরি করবে এবং `schema.prisma` ফাইল তৈরি হবে।

### `prisma/schema.prisma` ফাইল আপডেট করুন
```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

// User Role Enum - ইউজারের ধরন নির্ধারণ করে
enum Role {
  CUSTOMER  // সাধারণ ব্যবহারকারী
  ADMIN     // অ্যাডমিন ব্যবহারকারী
}

// User Model - ইউজারের সমস্ত তথ্য সংরক্ষণ করে
model User {
  id                     String    @id @default(uuid())  // Unique ID
  email                  String    @unique               // ইমেইল (unique)
  password               String                          // হ্যাশ করা পাসওয়ার্ড
  name                   String                          // ইউজারের নাম
  phone                  String?                         // ফোন (optional)
  image_url              String?                         // প্রোফাইল ছবি (optional)
  role                   Role      @default(CUSTOMER)    // ইউজারের role
  email_verified         Boolean   @default(false)       // ইমেইল verify হয়েছে কিনা
  is_active              Boolean   @default(true)        // অ্যাকাউন্ট active কিনা
  is_deleted             Boolean   @default(false)       // অ্যাকাউন্ট delete হয়েছে কিনা
  refresh_token          String?                         // Hashed refresh token
  password_reset_token   String?                         // পাসওয়ার্ড রিসেট টোকেন
  password_reset_expires DateTime?                       // টোকেন expire time
  password_reset_at      DateTime?                       // শেষ রিসেটের সময়
  created_at             DateTime  @default(now())       // তৈরির সময়
  updated_at             DateTime  @updatedAt            // আপডেটের সময়

  // Database Indexes - দ্রুত search এর জন্য
  @@index([email])
  @@index([refresh_token])
  @@index([password_reset_token])
  @@index([password_reset_at])
  @@map("users")  // Database table এর নাম
}
```

### Migration চালান
```bash
npx prisma migrate dev --name create_user_table
```

### Prisma Client Generate করুন
```bash
npx prisma generate
```

---

## 5. Prisma Module তৈরি

### Prisma Module ফাইল তৈরি করুন
```bash
nest generate module prisma
```

### Prisma Service তৈরি করুন
```bash
nest generate service prisma --no-spec
```

### `src/prisma/prisma.service.ts` আপডেট করুন
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // PostgreSQL connection pool তৈরি
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  // Application start হলে database connect করে
  async onModuleInit() {
    await this.$connect();
  }

  // Application বন্ধ হলে database disconnect করে
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### `src/prisma/prisma.module.ts` আপডেট করুন
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // সব module এ available হবে
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // অন্য module এ use করার জন্য export
})
export class PrismaModule {}
```

---

## 6. Users Module তৈরি

### Users Module তৈরি করুন
```bash
nest generate module users
```

### Users Controller তৈরি করুন
```bash
nest generate controller users --no-spec
```

### Users Service তৈরি করুন (providers ফোল্ডারে)
```bash
mkdir -p src/users/providers
```

`src/users/providers/users.service.ts` ফাইল তৈরি করুন:

```typescript
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../../auth/dtos/create-user.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Email দিয়ে user খুঁজে বের করে
   * Login এবং registration এ ব্যবহার হয়
   */
  async findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,  // Login verify এর জন্য
        name: true,
        role: true,
        is_active: true,
        is_deleted: true,
        email_verified: true,
        created_at: true,
      },
    });
  }

  /**
   * Refresh token দিয়ে user খুঁজে বের করে
   * Token refresh এ ব্যবহার হয়
   */
  async findByRefreshToken(token: string) {
    return this.prismaService.user.findFirst({
      where: { refresh_token: token },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        is_active: true,
        is_deleted: true,
        email_verified: true,
        created_at: true,
      },
    });
  }

  /**
   * নতুন user তৈরি করে
   * Registration এ ব্যবহার হয়
   */
  async createUser(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password,  // Already hashed password
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        email_verified: true,
        created_at: true,
      },
    });

    return user;
  }

  /**
   * User এর refresh token আপডেট করে
   * Login এবং token refresh এ ব্যবহার হয়
   */
  async updateRefreshToken(userId: string, refreshToken: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: refreshToken },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        email_verified: true,
        created_at: true,
      },
    });
  }

  /**
   * User এর refresh token মুছে দেয়
   * Logout এ ব্যবহার হয়
   */
  async revokeRefreshToken(userId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        email_verified: true,
        created_at: true,
      },
    });
  }
}
```

### `src/users/users.controller.ts` আপডেট করুন
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';

@ApiTags('users')
@Controller('users')
export class UsersController {
  
  // শুধুমাত্র ADMIN role এর user এই route access করতে পারবে
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return {
      message: 'Users fetched successfully',
      data: [],
    };
  }
}
```

### `src/users/users.module.ts` আপডেট করুন
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],  // AuthModule এ use করার জন্য export
})
export class UsersModule {}
```

---

## 7. Auth Module তৈরি

### Auth Module তৈরি করুন
```bash
nest generate module auth
```

### Auth Controller তৈরি করুন
```bash
nest generate controller auth --no-spec
```

### প্রয়োজনীয় ফোল্ডার structure তৈরি করুন
```bash
mkdir -p src/auth/providers
mkdir -p src/auth/dtos
mkdir -p src/auth/guards
mkdir -p src/auth/decorators
```

---

## 8. DTOs তৈরি

DTOs (Data Transfer Objects) হলো এমন class যা API request ও response এর data structure ও validation define করে।

### `src/auth/dtos/create-user.dto.ts` তৈরি করুন
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'ইউজারের ইমেইল অ্যাড্রেস',
  })
  @IsEmail({}, { message: 'সঠিক ইমেইল দিন' })
  @Transform(({ value }) => value?.toLowerCase().trim()) // lowercase এ convert
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'পাসওয়ার্ড (মিনিমাম ৮ অক্ষর)',
  })
  @IsString({ message: 'পাসওয়ার্ড অবশ্যই string হতে হবে' })
  @IsNotEmpty({ message: 'পাসওয়ার্ড দিতে হবে' })
  @MinLength(8, {
    message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
  })
  @MaxLength(128, {
    message: 'পাসওয়ার্ড ১২৮ অক্ষরের বেশি হতে পারবে না',
  })
  @Matches(/[a-z]/, {
    message: 'পাসওয়ার্ডে কমপক্ষে একটি ছোট হাতের অক্ষর থাকতে হবে',
  })
  @Matches(/[A-Z]/, {
    message: 'পাসওয়ার্ডে কমপক্ষে একটি বড় হাতের অক্ষর থাকতে হবে',
  })
  @Matches(/[0-9]/, {
    message: 'পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা থাকতে হবে',
  })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'পাসওয়ার্ডে কমপক্ষে একটি special character থাকতে হবে',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'ইউজারের পুরো নাম',
  })
  @IsString({ message: 'নাম অবশ্যই string হতে হবে' })
  @IsNotEmpty({ message: 'নাম দিতে হবে' })
  @MinLength(2, {
    message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে',
  })
  name: string;
}
```

### `src/auth/dtos/login.dto.ts` তৈরি করুন
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'ইউজারের ইমেইল অ্যাড্রেস',
  })
  @IsEmail({}, { message: 'সঠিক ইমেইল দিন' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'ইউজারের পাসওয়ার্ড',
  })
  @IsString({ message: 'পাসওয়ার্ড অবশ্যই string হতে হবে' })
  @IsNotEmpty({ message: 'পাসওয়ার্ড দিতে হবে' })
  password: string;
}
```

### `src/auth/dtos/refresh-token.dto.ts` তৈরি করুন
```typescript
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Login বা registration থেকে পাওয়া refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'Refresh token দিতে হবে' })
  @IsString({ message: 'Refresh token অবশ্যই string হতে হবে' })
  @IsJWT({ message: 'সঠিক refresh token দিন' })
  token: string;
}
```

---

## 9. Providers তৈরি

### `src/auth/providers/bcrypt.provider.ts` তৈরি করুন

এই provider password hashing এবং comparison এর জন্য ব্যবহৃত হয়।

```typescript
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BcryptProvider {
  /**
   * Password কে hash করে
   * Registration এ ব্যবহার হয়
   * 
   * @param data - Plain text password
   * @returns Hashed password
   */
  public async hashPassword(data: string | Buffer): Promise<string> {
    // Salt generate করে (random string যা hash কে unique করে)
    const salt = await bcrypt.genSalt();
    // Password hash করে return করে
    return bcrypt.hash(data, salt);
  }

  /**
   * Password compare করে
   * Login এ ব্যবহার হয়
   * 
   * @param data - User এর দেওয়া plain password
   * @param encrypted - Database এ stored hashed password
   * @returns true যদি match করে, false যদি না করে
   */
  public async comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
```

### `src/auth/providers/token.provider.ts` তৈরি করুন

এই provider JWT token generation এবং verification এর জন্য ব্যবহৃত হয়।

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

// Token payload interface - token এ কি কি data থাকবে
export interface TokenPayload {
  sub: string;    // User ID
  email: string;  // User email
  role: string;   // User role
}

@Injectable()
export class TokenProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Access Token generate করে
   * Short-lived token যা API request authenticate করতে ব্যবহার হয়
   * 
   * @param payload - Token এ যে data থাকবে
   * @returns JWT Access Token
   */
  public generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'access' },  // type: 'access' বলে এটা access token
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
        expiresIn: parseInt(
          this.configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600', // Default: 1 hour
        ),
      },
    );
  }

  /**
   * Refresh Token generate করে
   * Long-lived token যা নতুন access token পেতে ব্যবহার হয়
   * 
   * @param payload - Token এ যে data থাকবে
   * @returns JWT Refresh Token
   */
  public generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },  // type: 'refresh' বলে এটা refresh token
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
        expiresIn: parseInt(
          this.configService.get<string>('JWT_REFRESH_TOKEN_TTL') ?? '604800', // Default: 7 days
        ),
      },
    );
  }

  /**
   * Refresh Token verify করে
   * Token refresh এ ব্যবহার হয়
   * 
   * @param token - Refresh token
   * @returns Decoded token payload
   */
  public verifyRefreshToken(token: string): TokenPayload & { type: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
      issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
    }) as TokenPayload & { type: string };
  }

  /**
   * Token কে SHA256 দিয়ে hash করে
   * Database এ refresh token store করার আগে hash করা হয় security এর জন্য
   * 
   * @param token - Token to hash
   * @returns Hashed token
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
```

### `src/auth/providers/auth.service.ts` তৈরি করুন

এটি main authentication service যা সব auth logic handle করে।

```typescript
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UsersService } from 'src/users/providers/users.service';
import { BcryptProvider } from './bcrypt.provider';
import { TokenProvider } from './token.provider';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly bcryptProvider: BcryptProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly usersService: UsersService,
  ) {}

  /**
   * নতুন user register করে
   * 
   * Flow:
   * 1. Check করে email already exists কিনা
   * 2. Password hash করে
   * 3. User create করে
   * 4. Access ও Refresh token generate করে
   * 5. Refresh token hash করে database এ save করে
   * 6. Tokens ও user data return করে
   */
  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    // Check করছি user already exists কিনা
    const existingUser = await this.usersService.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('এই ইমেইল দিয়ে আগেই account তৈরি হয়েছে');
    }

    // Password hash করছি
    const hashedPassword = await this.bcryptProvider.hashPassword(password);

    // User create করছি
    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      name,
    });

    // Token payload তৈরি
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Tokens generate
    const access_token = this.tokenProvider.generateAccessToken(payload);
    const refresh_token = this.tokenProvider.generateRefreshToken(payload);

    // Refresh token hash করে database এ save
    const hashedRefreshToken = this.tokenProvider.hashToken(refresh_token);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  /**
   * User login করে
   * 
   * Flow:
   * 1. Email দিয়ে user খুঁজে
   * 2. Password verify করে
   * 3. Tokens generate করে
   * 4. Refresh token database এ save করে
   * 5. Tokens ও user data return করে (password ছাড়া)
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // User খুঁজছি
    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('ভুল ইমেইল অথবা পাসওয়ার্ড');
    }

    // Password check করছি
    const isPasswordValid = await this.bcryptProvider.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('ভুল ইমেইল অথবা পাসওয়ার্ড');
    }

    // Token payload
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Tokens generate
    const access_token = this.tokenProvider.generateAccessToken(payload);
    const refresh_token = this.tokenProvider.generateRefreshToken(payload);

    // Refresh token save
    const hashedRefreshToken = this.tokenProvider.hashToken(refresh_token);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    // Password remove করে user return করছি
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  /**
   * Token refresh করে
   * 
   * Flow:
   * 1. Refresh token verify করে
   * 2. Token type check করে
   * 3. Hashed token দিয়ে user খুঁজে
   * 4. User status check করে (active, deleted)
   * 5. নতুন tokens generate করে
   * 6. নতুন refresh token save করে
   * 7. নতুন tokens return করে
   */
  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      // Token verify
      const decoded = this.tokenProvider.verifyRefreshToken(
        refreshTokenDto.token,
      );

      // Token type check
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Hashed token দিয়ে user খুঁজছি
      const hashedToken = this.tokenProvider.hashToken(refreshTokenDto.token);
      const user = await this.usersService.findByRefreshToken(hashedToken);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // User status check
      if (user.is_active === false) {
        throw new UnauthorizedException('Account deactivated');
      }

      if (user.is_deleted === true) {
        throw new UnauthorizedException('Account deleted');
      }

      // নতুন tokens generate
      const payload = { sub: user.id, email: user.email, role: user.role };
      const access_token = this.tokenProvider.generateAccessToken(payload);
      const new_refresh_token =
        this.tokenProvider.generateRefreshToken(payload);

      // নতুন refresh token save
      const newHashedRefreshToken =
        this.tokenProvider.hashToken(new_refresh_token);
      await this.usersService.updateRefreshToken(
        user.id,
        newHashedRefreshToken,
      );

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * User logout করে
   * Database থেকে refresh token মুছে দেয়
   */
  async logout(userId: string) {
    await this.usersService.revokeRefreshToken(userId);
    return { message: 'সফলভাবে logout হয়েছে' };
  }
}
```

---

## 10. Guards তৈরি

Guards হলো এমন class যা route access control করে।

### `src/auth/guards/auth.guard.ts` তৈরি করুন

এই guard সব protected route এ JWT token verify করে।

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UsersService } from 'src/users/providers/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check করছি route public কিনা
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Public route হলে allow করি
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Header থেকে token বের করি
    const token = this.extractHeaderFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token দেওয়া হয়নি');
    }

    try {
      // Token verify করি
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
      });

      // নিশ্চিত করি এটা access token, refresh token না
      if (payload.type === 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // User এখনও exists কিনা check
      const user = await this.usersService.findUserByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('User exists করে না');
      }

      // User active কিনা check
      if (user.is_active === false) {
        throw new UnauthorizedException('Account deactivated');
      }

      // User deleted কিনা check
      if (user.is_deleted === true) {
        throw new UnauthorizedException('Account deleted');
      }

      // Request object এ user attach করি
      // পরে controller এ req.user দিয়ে access করা যাবে
      const requestUser = {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      request['user'] = requestUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  /**
   * Authorization header থেকে Bearer token বের করে
   * Format: "Bearer <token>"
   */
  private extractHeaderFromHeader(request: Request): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, token] = request.headers.authorization?.split(' ') ?? [];

    return token;
  }
}
```

### `src/auth/guards/roles.guard.ts` তৈরি করুন

এই guard role-based access control করে।

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Route এ কোন roles required সেটা বের করি
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // কোন role specified না থাকলে allow করি
    if (!requiredRoles) {
      return true;
    }

    // Request থেকে user বের করি (AuthGuard set করেছে)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User authenticated নয়');
    }

    if (!user.role) {
      throw new ForbiddenException('User role পাওয়া যায়নি');
    }

    // Check করি user এর role allowed কিনা
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. প্রয়োজনীয় roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

---

## 11. Decorators তৈরি

Custom decorators routes এ metadata add করতে ব্যবহার হয়।

### `src/auth/decorators/public.decorator.ts` তৈরি করুন

এই decorator দিয়ে route কে public করা যায় (authentication ছাড়া access করা যায়)।

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * এই decorator ব্যবহার করলে route public হয়ে যাবে
 * AuthGuard এই route skip করবে
 * 
 * Example:
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### `src/auth/decorators/roles.decorator.ts` তৈরি করুন

এই decorator দিয়ে route এ role restriction দেওয়া যায়।

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

/**
 * এই decorator দিয়ে route এ role restriction দেওয়া যায়
 * RolesGuard এই metadata পড়ে access check করে
 * 
 * Example:
 * @Roles(Role.ADMIN)
 * @Get('admin-only')
 * async adminRoute() { ... }
 * 
 * @Roles(Role.ADMIN, Role.CUSTOMER)
 * @Get('both-roles')
 * async bothRolesRoute() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

---

## 12. App Module কনফিগার

### `src/auth/auth.controller.ts` তৈরি করুন

```typescript
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthService } from './providers/auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User Registration
   * POST /api/v1/auth/register
   */
  @Public()  // কোন authentication লাগবে না
  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const result = await this.authService.register(createUserDto);
    return {
      message: 'Registration সফল হয়েছে',
      data: result,
    };
  }

  /**
   * User Login
   * POST /api/v1/auth/login
   */
  @Public()  // কোন authentication লাগবে না
  @Post('login')
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login সফল হয়েছে',
      data: result,
    };
  }

  /**
   * Token Refresh
   * POST /api/v1/auth/refresh
   */
  @Public()  // কোন authentication লাগবে না
  @Post('refresh')
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refresh(refreshTokenDto);
    return {
      message: 'Token refresh সফল হয়েছে',
      data: result,
    };
  }

  /**
   * User Logout
   * POST /api/v1/auth/logout
   * Requires: Bearer Token in Authorization header
   */
  @Post('logout')
  @ApiBearerAuth()  // Swagger এ Bearer token field দেখাবে
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { user: { sub: string } }) {
    // req.user AuthGuard থেকে আসে
    const result = await this.authService.logout(req.user.sub);
    return {
      message: result.message,
    };
  }
}
```

### `src/auth/auth.module.ts` আপডেট করুন

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from '@nestjs/config';
import { BcryptProvider } from './providers/bcrypt.provider';
import { TokenProvider } from './providers/token.provider';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,  // UsersService ব্যবহার করার জন্য
    JwtModule.registerAsync({
      global: true,  // সব module এ available হবে
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(
            configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [ConfigService, AuthService, BcryptProvider, TokenProvider],
})
export class AuthModule {}
```

### `src/app.module.ts` আপডেট করুন

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core/constants';
import { AuthGuard } from './auth/guards/auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Environment variables globally available
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    // Global AuthGuard - সব route এ apply হবে
    { provide: APP_GUARD, useClass: AuthGuard },
    // Global RolesGuard - AuthGuard এর পরে run হবে
    { provide: APP_GUARD, useClass: RolesGuard },
    AppService,
  ],
})
export class AppModule {}
```

---

## 13. Main.ts কনফিগার

### `src/main.ts` আপডেট করুন

```typescript
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Environment variables থেকে config পড়া
  const port = configService.get<number>('PORT', 8000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const normalizedApiPrefix = apiPrefix.startsWith('/')
    ? apiPrefix
    : `/${apiPrefix}`;
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  const frontendUrls = corsOrigin?.split(',');

  // Body parsing middleware
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      return express.json()(req, res, next);
    },
  );

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      return express.urlencoded({ extended: true })(req, res, next);
    },
  );

  // Global API prefix set
  app.setGlobalPrefix(normalizedApiPrefix);

  // CORS enable
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Global ValidationPipe - DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // DTO তে নেই এমন property remove করে
      forbidNonWhitelisted: true, // Extra property থাকলে error দেয়
      transform: true,           // Type transformation enable
      transformOptions: {
        enableImplicitConversion: true,  // Auto type conversion
      },
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),      // Request logging
    new TransformInterceptor(),    // Response format standardize
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('My Auth API')
    .setDescription('Authentication API Documentation')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`)
    .addBearerAuth()  // JWT authentication support
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  console.log(
    `🚀 Application running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(
    `📚 Swagger docs: http://localhost:${port}/${apiPrefix}/docs`,
  );
}

bootstrap();
```

---

## 14. Common Utilities

### Interceptors ও Filters তৈরি করুন

```bash
mkdir -p src/common/interceptors
mkdir -p src/common/filters
```

### `src/common/interceptors/transform.interceptor.ts` তৈরি করুন

এই interceptor সব response কে একই format এ convert করে।

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Standard API Response format
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(({ message, data }) => ({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### `src/common/interceptors/logging.interceptor.ts` তৈরি করুন

এই interceptor সব request log করে।

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
      }),
    );
  }
}
```

### `src/common/filters/http-exception.filter.ts` তৈরি করুন

এই filter সব error কে standardized format এ convert করে।

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
  path?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    // HttpException handle
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        
        // Validation errors
        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          message = 'Validation failed';
        }
      }
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${statusCode}: ${message}`,
    );

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      ...(!this.isProduction && { path: request.url }),
    };

    response.status(statusCode).json(errorResponse);
  }
}
```

---

## 15. API টেস্টিং

### Server চালু করুন
```bash
yarn start:dev
```

### Swagger Documentation
Browser এ যান: `http://localhost:8000/api/v1/docs`

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | User registration | ❌ |
| POST | `/api/v1/auth/login` | User login | ❌ |
| POST | `/api/v1/auth/refresh` | Token refresh | ❌ |
| POST | `/api/v1/auth/logout` | User logout | ✅ |
| GET | `/api/v1/users` | Get all users (Admin only) | ✅ + Admin Role |

### cURL দিয়ে টেস্ট

#### Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password@123",
    "name": "Test User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password@123"
  }'
```

#### Token Refresh
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-refresh-token-here"
  }'
```

#### Logout (Token required)
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer your-access-token-here"
```

#### Protected Route (Admin Only)
```bash
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer your-access-token-here"
```

---

## 📁 Final Project Structure

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dtos/
│   │   ├── create-user.dto.ts
│   │   ├── login.dto.ts
│   │   └── refresh-token.dto.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   └── providers/
│       ├── auth.service.ts
│       ├── bcrypt.provider.ts
│       └── token.provider.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       ├── logging.interceptor.ts
│       └── transform.interceptor.ts
├── generated/
│   └── prisma/
│       └── ... (auto-generated)
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── users/
    ├── users.controller.ts
    ├── users.module.ts
    └── providers/
        └── users.service.ts
```

---

## 🔐 Security Best Practices

1. **Password Hashing**: bcrypt ব্যবহার করা হয়েছে যা industry standard
2. **JWT Tokens**: Access token short-lived (1 hour), Refresh token long-lived (7 days)
3. **Refresh Token Rotation**: প্রতিবার refresh করলে নতুন refresh token দেওয়া হয়
4. **Token Hashing**: Refresh token database এ hash করে store করা হয়
5. **Token Type Validation**: Access ও refresh token আলাদা করা হয়েছে
6. **User Status Check**: Deactivated বা deleted user login করতে পারে না
7. **Validation**: সব input properly validate করা হয়

---

## 🎉 সমাপ্তি

অভিনন্দন! আপনি সফলভাবে একটি production-ready authentication system তৈরি করেছেন NestJS দিয়ে।

এই system এ আছে:
- ✅ Secure password hashing
- ✅ JWT-based authentication
- ✅ Access ও Refresh token
- ✅ Token refresh mechanism
- ✅ Role-based authorization
- ✅ Global guards
- ✅ Input validation
- ✅ Standardized API responses
- ✅ Error handling
- ✅ Request logging
- ✅ Swagger documentation

---

## 📚 আরও শিখতে

- [NestJS Official Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/)
- [bcrypt npm](https://www.npmjs.com/package/bcrypt)

---

**লেখক**: Generated from existing codebase  
**সর্বশেষ আপডেট**: January 2026

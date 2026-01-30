# Authentication & Authorization সম্পূর্ণ সেটআপ গাইড (বাংলা)

এই ডকুমেন্টে আপনি শিখবেন কিভাবে NestJS অ্যাপ্লিকেশনে সম্পূর্ণ Authentication এবং Authorization সিস্টেম তৈরি করতে হয়। একদম নতুনদের জন্য ধাপে ধাপে বর্ণনা করা হয়েছে।

---

## 📚 সূচিপত্র

1. [মূল ধারণা](#মূল-ধারণা)
2. [প্রজেক্ট স্ট্রাকচার](#প্রজেক্ট-স্ট্রাকচার)
3. [ধাপে ধাপে সেটআপ](#ধাপে-ধাপে-সেটআপ)
4. [ব্যবহার পদ্ধতি](#ব্যবহার-পদ্ধতি)
5. [টেস্টিং গাইড](#টেস্টিং-গাইড)

---

## 🎯 মূল ধারণা

### Authentication (প্রমাণীকরণ) কি?

**সহজ ভাষায়:** ইউজার কে, সেটা যাচাই করা। যেমন - লগইন করার সময় ইমেইল ও পাসওয়ার্ড দিয়ে প্রমাণ করা যে আপনি সত্যিকারের ইউজার।

**উদাহরণ:** 
- আপনি যখন ফেসবুকে লগইন করেন, তখন ইমেইল ও পাসওয়ার্ড দিয়ে প্রমাণ করেন যে এটা আপনার অ্যাকাউন্ট।

### Authorization (অনুমোদন) কি?

**সহজ ভাষায়:** ইউজার কি কি করতে পারবে, সেটা নির্ধারণ করা। যেমন - একজন Customer অর্ডার দিতে পারবে, কিন্তু সব ইউজারের লিস্ট দেখতে পারবে না। কিন্তু Admin সব করতে পারবে।

**উদাহরণ:**
- একজন সাধারণ ইউজার (Customer) শুধু নিজের প্রোফাইল দেখতে পারবে
- একজন Admin সব ইউজারের তথ্য দেখতে ও মুছতে পারবে

### JWT (JSON Web Token) কি?

**সহজ ভাষায়:** একটা বিশেষ কোড (টোকেন) যেটা লগইনের পর সার্ভার থেকে দেয়া হয়। এরপর প্রতিবার API কল করার সময় এই টোকেন পাঠাতে হয়, যাতে সার্ভার বুঝতে পারে আপনি কে।

**উদাহরণ:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

এই টোকেনের ভিতরে থাকে:
```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Guards (গার্ড) কি?

**সহজ ভাষায়:** একটা সিকিউরিটি চেকপয়েন্ট। যেমন বিল্ডিংয়ে ঢোকার আগে সিকিউরিটি গার্ড আপনার আইডি কার্ড চেক করে।

আমাদের প্রজেক্টে দুটো Guard আছে:

1. **AuthGuard** - JWT টোকেন চেক করে (ইউজার লগইন করা আছে কিনা)
2. **RolesGuard** - ইউজারের Role চেক করে (ইউজারের Permission আছে কিনা)

### Decorators (ডেকোরেটর) কি?

**সহজ ভাষায়:** একটা বিশেষ চিহ্ন যেটা @ দিয়ে শুরু হয়। এটা দিয়ে আমরা কোড লিখে নিয়ম বলে দিতে পারি।

**উদাহরণ:**
```typescript
@Public()  // এই route টা সবার জন্য খোলা
@Get()
login() { }

@Roles(Role.ADMIN)  // শুধু Admin access করতে পারবে
@Get()
getAllUsers() { }
```

---

## 📁 প্রজেক্ট স্ট্রাকচার

```
src/
├── auth/                          # Authentication সংক্রান্ত সব কিছু
│   ├── decorators/               # কাস্টম ডেকোরেটরগুলো
│   │   ├── public.decorator.ts   # @Public() ডেকোরেটর
│   │   └── roles.decorator.ts    # @Roles() ডেকোরেটর
│   ├── guards/                   # সিকিউরিটি Guards
│   │   ├── auth.guard.ts         # JWT Authentication চেক করে
│   │   └── roles.guard.ts        # User Role চেক করে
│   ├── providers/
│   │   ├── auth.service.ts       # Login, Register logic
│   │   └── bcrypt.provider.ts    # Password encrypt করে
│   ├── dtos/                     # Data Transfer Objects
│   │   ├── create-user.dto.ts   # Register এর data structure
│   │   └── login.dto.ts          # Login এর data structure
│   ├── auth.controller.ts        # Login, Register routes
│   └── auth.module.ts            # Auth module setup
│
├── users/                        # User management
│   ├── users.controller.ts      
│   ├── users.service.ts         
│   └── users.module.ts          
│
├── prisma/                       # Database সংক্রান্ত
│   └── schema.prisma            # Database structure
│
└── app.module.ts                # Main module (Guards register করা হয়)
```

---

## 🔧 ধাপে ধাপে সেটআপ

### ধাপ ১: Database Schema তৈরি

প্রথমে `prisma/schema.prisma` ফাইলে User model ও Role enum তৈরি করুন:

```prisma
// Role enum - ইউজারের ধরন নির্ধারণ করে
enum Role {
  CUSTOMER  // সাধারণ ইউজার (ডিফল্ট)
  ADMIN     // অ্যাডমিন ইউজার
}

model User {
  id                     String    @id @default(uuid())
  email                  String    @unique
  password               String    // এনক্রিপ্টেড পাসওয়ার্ড
  name                   String
  phone                  String?
  role                   Role      @default(CUSTOMER)  // ডিফল্ট CUSTOMER
  email_verified         Boolean   @default(false)
  is_active              Boolean   @default(true)
  created_at             DateTime  @default(now())
  updated_at             DateTime  @updatedAt

  @@map("users")
}
```

**কি হচ্ছে এখানে?**
- `Role` enum দুটো ভ্যালু আছে: CUSTOMER এবং ADMIN
- User model এ `role` field আছে, যেটার ডিফল্ট মান CUSTOMER
- নতুন ইউজার রেজিস্টার করলে সে CUSTOMER হিসেবে তৈরি হবে

**Migration চালান:**
```bash
npx prisma migrate dev --name create_user_table
```

---

### ধাপ ২: Public Decorator তৈরি

**ফাইল:** `src/auth/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**কি কাজ করে?**
- যে route এ `@Public()` লাগানো হবে, সেটা authentication ছাড়াই access করা যাবে
- Login ও Register route এ এটা ব্যবহার করা হয়

---

### ধাপ ৩: Roles Decorator তৈরি

**ফাইল:** `src/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**কি কাজ করে?**
- কোন route এ কোন role দরকার, সেটা নির্ধারণ করে
- যেমন: `@Roles(Role.ADMIN)` মানে শুধু Admin access করতে পারবে

---

### ধাপ ৪: Auth Guard তৈরি

**ফাইল:** `src/auth/guards/auth.guard.ts`

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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ১. প্রথমে চেক করো route টা Public কিনা
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // যদি Public হয়, তাহলে সরাসরি access দাও
    if (isPublic) {
      return true;
    }

    // ২. Request থেকে token নাও
    const request = context.switchToHttp().getRequest();
    const token = this.extractHeaderFromHeader(request);

    // ৩. Token না থাকলে Unauthorized error দাও
    if (!token) {
      throw new UnauthorizedException('Token পাওয়া যায়নি');
    }

    try {
      // ৪. Token verify করো (বৈধ কিনা চেক করো)
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
      });

      // ৫. Payload থেকে user info request object এ রাখো
      // পরে RolesGuard এবং Controller এ ব্যবহার করা যাবে
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid বা expired token');
    }

    return true;
  }

  // Request header থেকে Bearer token বের করো
  private extractHeaderFromHeader(request: Request): string | undefined {
    const [_, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
```

**কি কাজ করে? (Step by Step)**

1. **Public Check:** প্রথমে দেখে route টা `@Public()` দিয়ে মার্ক করা আছে কিনা। থাকলে সরাসরি access দেয়।

2. **Token Extract:** Request header থেকে JWT token বের করে। Format: `Authorization: Bearer <token>`

3. **Token Validation:** Token টা valid কিনা চেক করে। Expired বা fake হলে error দেয়।

4. **User Info Store:** Token থেকে user info বের করে `request.user` তে রাখে, যাতে পরে ব্যবহার করা যায়।

---

### ধাপ ৫: Roles Guard তৈরি

**ফাইল:** `src/auth/guards/roles.guard.ts`

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
    // ১. Route এ কোন role লাগবে সেটা বের করো
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // ২. যদি কোন role specify করা না থাকে, তাহলে access দাও
    // মানে যেকোনো authenticated user access করতে পারবে
    if (!requiredRoles) {
      return true;
    }

    // ৩. Request থেকে user info নাও (AuthGuard set করে দিয়েছে)
    const { user } = context.switchToHttp().getRequest();

    // ৪. User না থাকলে error
    if (!user) {
      throw new ForbiddenException('User authenticated নয়');
    }

    // ৫. User এর role না থাকলে error
    if (!user.role) {
      throw new ForbiddenException('User role পাওয়া যায়নি');
    }

    // ৬. User এর role required roles এর মধ্যে আছে কিনা চেক করো
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. আপনার ${requiredRoles.join(', ')} role দরকার`,
      );
    }

    return true;
  }
}
```

**কি কাজ করে? (Step by Step)**

1. **Required Roles Check:** Route এ `@Roles()` দিয়ে কি role চাওয়া হয়েছে সেটা দেখে।

2. **No Role Specified:** যদি কোন role specify করা না থাকে, মানে যেকোনো authenticated user access পাবে।

3. **User Info:** AuthGuard যে user info set করেছিল, সেটা নেয়।

4. **Role Matching:** User এর role আর required roles match করে কিনা দেখে।

5. **Access Decision:** Match করলে access দেয়, না করলে 403 Forbidden error দেয়।

---

### ধাপ ৬: Auth Service আপডেট

**ফাইল:** `src/auth/providers/auth.service.ts`

JWT payload তে role যোগ করুন:

```typescript
// Register method এ
const payload = { 
  sub: user.id, 
  email: user.email, 
  role: user.role  // এইটা যোগ করুন
};

// Login method এও same
const payload = { 
  sub: user.id, 
  email: user.email, 
  role: user.role  // এইটা যোগ করুন
};
```

**কেন দরকার?**
- JWT token এ role রাখলে, token verify করার সময় user এর role পাওয়া যাবে
- এতে database query কম করতে হবে

---

### ধাপ ৭: Guards Register করা

**ফাইল:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core/constants';
import { AuthGuard } from './auth/guards/auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // ... অন্যান্য imports
  ],
  providers: [
    // Global guard হিসেবে register করা
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    AppService,
  ],
})
export class AppModule {}
```

**কি হচ্ছে?**
- `APP_GUARD` দিয়ে register করলে সব route এ automatically apply হয়
- প্রতিটা request আসলে প্রথমে AuthGuard, তারপর RolesGuard দিয়ে যাবে

---

### ধাপ ৮: Auth Controller আপডেট

**ফাইল:** `src/auth/auth.controller.ts`

```typescript
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register route - সবার জন্য open
  @Public()  // এই decorator লাগানো মানে authentication লাগবে না
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const result = await this.authService.register(createUserDto);
    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  // Login route - সবার জন্য open
  @Public()  // এই decorator লাগানো মানে authentication লাগবে না
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      data: result,
    };
  }
}
```

**কেন @Public() দরকার?**
- Login ও Register route এ যদি authentication চাই, তাহলে তো user login ই করতে পারবে না!
- তাই এই routes গুলো Public করে দিতে হবে

---

## 🎮 ব্যবহার পদ্ধতি

### ১. Public Route (সবার জন্য খোলা)

**কখন ব্যবহার করবেন:**
- Login
- Register
- Password reset request
- Email verification
- Health check

**Example:**

```typescript
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  // সবাই product list দেখতে পারবে
  @Public()
  @Get()
  getAllProducts() {
    return this.productsService.findAll();
  }
}
```

---

### ২. Authenticated Route (যেকোনো লগইন ইউজার)

**কখন ব্যবহার করবেন:**
- User profile দেখা
- নিজের তথ্য update করা
- নিজের order দেখা

**Example:**

```typescript
@Controller('profile')
export class ProfileController {
  // কোন decorator লাগবে না, automatically authenticated হবে
  @Get()
  getProfile(@Request() req) {
    // req.user তে user info পাবেন
    console.log(req.user); // { sub: 'user-id', email: '...', role: 'CUSTOMER' }
    return this.profileService.getProfile(req.user.sub);
  }

  @Put()
  updateProfile(@Request() req, @Body() updateDto: any) {
    return this.profileService.update(req.user.sub, updateDto);
  }
}
```

---

### ৩. Admin Only Route

**কখন ব্যবহার করবেন:**
- সব user এর list দেখা
- User delete করা
- Product create/update/delete
- Dashboard analytics

**Example:**

```typescript
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';

@Controller('admin/users')
export class AdminUsersController {
  // শুধু Admin দেখতে পারবে
  @Roles(Role.ADMIN)
  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  // শুধু Admin delete করতে পারবে
  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  // শুধু Admin অন্য user এর role change করতে পারবে
  @Roles(Role.ADMIN)
  @Patch(':id/role')
  changeUserRole(@Param('id') id: string, @Body() roleDto: any) {
    return this.usersService.updateRole(id, roleDto.role);
  }
}
```

---

### ৪. Customer Only Route

**কখন ব্যবহার করবেন:**
- Order করা
- Cart এ add করা
- Review লেখা
- Wishlist manage করা

**Example:**

```typescript
@Controller('orders')
export class OrdersController {
  // শুধু Customer order দিতে পারবে
  @Roles(Role.CUSTOMER)
  @Post()
  createOrder(@Request() req, @Body() orderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, orderDto);
  }

  // নিজের orders দেখা - যেকোনো authenticated user
  @Get('my-orders')
  getMyOrders(@Request() req) {
    return this.ordersService.findByUserId(req.user.sub);
  }
}
```

---

### ৫. Multiple Roles (একাধিক Role)

**কখন ব্যবহার করবেন:**
- Admin ও Customer উভয়েই access করতে পারবে

**Example:**

```typescript
@Controller('products')
export class ProductsController {
  // সবাই দেখতে পারবে
  @Public()
  @Get()
  getAllProducts() {
    return this.productsService.findAll();
  }

  // Admin ও Customer উভয়েই details দেখতে পারবে
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':id/details')
  getProductDetails(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // শুধু Admin create করতে পারবে
  @Roles(Role.ADMIN)
  @Post()
  createProduct(@Body() productDto: CreateProductDto) {
    return this.productsService.create(productDto);
  }
}
```

---

### ৬. Controller Level Decorator

**পুরো Controller এ একসাথে apply করা:**

```typescript
// সব routes এ Admin role লাগবে
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  getDashboard() {
    // Admin only
  }

  @Get('stats')
  getStats() {
    // Admin only
  }

  // এই route টা override করা - Public করা
  @Public()
  @Get('health')
  getHealth() {
    // সবাই access করতে পারবে
  }
}
```

---

## 🧪 টেস্টিং গাইড

### প্রয়োজনীয় টুলস

1. **Postman** - API testing এর জন্য
2. **Thunder Client** - VS Code extension (optional)
3. **curl** - Terminal থেকে test করার জন্য

---

### ধাপ ১: User Register করা (Public Route)

**Request:**
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "sakib@example.com",
  "password": "123456",
  "name": "Sakib Al Hasan"
}
```

**Postman এ:**
1. Method: POST
2. URL: `http://localhost:3000/auth/register`
3. Body → raw → JSON
4. উপরের JSON paste করুন
5. Send বাটনে ক্লিক করুন

**Response:**
```json
{
  "message": "User registered successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "sakib@example.com",
      "name": "Sakib Al Hasan",
      "role": "CUSTOMER"
    }
  }
}
```

**⚠️ Important:** `access_token` টা কপি করে রাখুন। পরে লাগবে।

---

### ধাপ ২: User Login করা (Public Route)

**Request:**
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "sakib@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "sakib@example.com",
      "name": "Sakib Al Hasan",
      "role": "CUSTOMER"
    }
  }
}
```

---

### ধাপ ৩: Protected Route Access করা

**Request:**
```bash
GET http://localhost:3000/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Postman এ:**
1. Method: GET
2. URL: `http://localhost:3000/profile`
3. Headers → Add:
   - Key: `Authorization`
   - Value: `Bearer আপনার_access_token`
4. Send

**সফল Response (200 OK):**
```json
{
  "message": "Profile data",
  "data": { ... }
}
```

**ব্যর্থ Response - Token না দিলে (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### ধাপ ৪: Admin Route Test করা

**প্রথমে Customer দিয়ে try করুন:**

```bash
GET http://localhost:3000/users
Authorization: Bearer customer_token
```

**Response (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "Access denied. আপনার ADMIN role দরকার"
}
```

**Admin User তৈরি করুন:**

Database এ manually role change করুন:

```sql
-- pgAdmin বা database client দিয়ে run করুন
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'sakib@example.com';
```

অথবা Prisma Studio দিয়ে:
```bash
npx prisma studio
```
1. Users table এ যান
2. User select করুন
3. role field এ `ADMIN` সেট করুন
4. Save করুন

**এখন আবার login করুন** (নতুন token পেতে):

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "sakib@example.com",
  "password": "123456"
}
```

নতুন token এ role হবে `ADMIN`।

**Admin route access করুন:**

```bash
GET http://localhost:3000/users
Authorization: Bearer admin_token
```

**সফল Response (200 OK):**
```json
{
  "message": "Users fetched successfully",
  "data": [...]
}
```

---

### ধাপ ৫: Public Route Test (Token ছাড়া)

```bash
GET http://localhost:3000/products
# কোন Authorization header লাগবে না
```

**Response:**
```json
{
  "message": "Products",
  "data": [...]
}
```

---

## 🔍 কিভাবে কাজ করে? (Flow Diagram)

### Scenario 1: Public Route

```
User Request → AuthGuard → Check @Public()? 
                             ↓ YES
                          Allow Access → Controller
```

### Scenario 2: Authenticated Route (No Role)

```
User Request → AuthGuard → Check @Public()? 
                             ↓ NO
                          Check JWT Token
                             ↓ Valid
                          Add user to request
                             ↓
                          RolesGuard → Check @Roles()?
                                         ↓ NO
                                      Allow Access → Controller
```

### Scenario 3: Admin Only Route

```
User Request → AuthGuard → Check @Public()? 
                             ↓ NO
                          Check JWT Token
                             ↓ Valid (CUSTOMER role)
                          Add user to request
                             ↓
                          RolesGuard → Check @Roles(ADMIN)?
                                         ↓ YES
                                      Check user.role === ADMIN?
                                         ↓ NO
                                      403 Forbidden
```

---

## ❓ সাধারণ সমস্যা ও সমাধান

### সমস্যা ১: "Unauthorized" error আসে

**কারণ:**
- JWT token পাঠাননি
- Token expired
- Token invalid

**সমাধান:**
1. Postman এ Authorization header চেক করুন
2. Token format: `Bearer <token>` (Bearer এর পর space দিতে হবে)
3. আবার login করে নতুন token নিন

---

### সমস্যা ২: "Access denied. আপনার ADMIN role দরকার"

**কারণ:**
- আপনার role CUSTOMER কিন্তু route এ ADMIN লাগে

**সমাধান:**
1. Database এ user এর role ADMIN করে দিন
2. আবার login করুন (নতুন token এ ADMIN role থাকবে)

---

### সমস্যা ৩: Token verify করতে পারছে না

**কারণ:**
- JWT_SECRET match করছে না
- Token issuer/audience mismatch

**সমাধান:**
1. `.env` file চেক করুন:
```env
JWT_SECRET=your-secret-key-here
JWT_TOKEN_AUDIENCE=localhost:3000
JWT_TOKEN_ISSUER=localhost:3000
JWT_ACCESS_TOKEN_TTL=3600
```

2. auth.service.ts এ যে config দিয়েছেন, auth.guard.ts এও same দিন

---

### সমস্যা ৪: "User role পাওয়া যায়নি"

**কারণ:**
- JWT payload তে role field নেই

**সমাধান:**
auth.service.ts এ payload তে role যোগ করুন:
```typescript
const payload = { 
  sub: user.id, 
  email: user.email, 
  role: user.role  // এইটা আছে তো?
};
```

---

## 📋 Checklist - সব ঠিক আছে কিনা

### Database
- [ ] Role enum তৈরি হয়েছে (CUSTOMER, ADMIN)
- [ ] User model এ role field আছে
- [ ] Migration run করা হয়েছে

### Decorators
- [ ] public.decorator.ts তৈরি হয়েছে
- [ ] roles.decorator.ts তৈরি হয়েছে

### Guards
- [ ] auth.guard.ts তৈরি হয়েছে
- [ ] roles.guard.ts তৈরি হয়েছে
- [ ] app.module.ts এ register করা হয়েছে

### Auth Service
- [ ] JWT payload তে role field যোগ করা হয়েছে

### Controllers
- [ ] Login/Register route এ @Public() আছে
- [ ] Admin routes এ @Roles(Role.ADMIN) আছে

### Environment
- [ ] .env file এ JWT config আছে
- [ ] JWT_SECRET set করা আছে

---

## 🎓 আরও উন্নত বিষয়

### Refresh Token

লম্বা সময়ের জন্য login থাকার জন্য refresh token ব্যবহার করা হয়:

```typescript
// Generate করার সময়
const access_token = this.jwtService.sign(payload, {
  expiresIn: '15m'  // ১৫ মিনিট
});

const refresh_token = this.jwtService.sign(payload, {
  expiresIn: '7d'  // ৭ দিন
});
```

### Custom Decorator - CurrentUser

সহজে current user পাওয়ার জন্য:

```typescript
// current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// ব্যবহার
@Get('profile')
getProfile(@CurrentUser() user: any) {
  console.log(user); // { sub: '...', email: '...', role: '...' }
  return this.profileService.get(user.sub);
}
```

### Permission Based Authorization

Role এর পরিবর্তে Permission ব্যবহার:

```typescript
// Database
model Permission {
  id   String @id
  name String @unique // 'users.read', 'users.write', 'orders.create'
}

model Role {
  id          String       @id
  name        String
  permissions Permission[]
}

// Decorator
@Permissions('users.read', 'users.write')
@Get()
getUsers() { }
```

---

## 📚 আরও শিখুন

### Recommended Resources

1. **NestJS Official Docs:** https://docs.nestjs.com/security/authentication
2. **JWT.io:** https://jwt.io/ (Token decode করে দেখতে পারবেন)
3. **Prisma Docs:** https://www.prisma.io/docs

### Next Steps

1. Email verification implement করুন
2. Password reset functionality যোগ করুন
3. Two-factor authentication (2FA) add করুন
4. Rate limiting add করুন (brute force attack prevent করতে)
5. Logging system implement করুন

---

## 💡 সেরা পদ্ধতিসমূহ (Best Practices)

### ১. Token Security

```typescript
// ❌ খারাপ - Token console এ print করবেন না
console.log('Token:', token);

// ✅ ভালো - শুধু development এ
if (process.env.NODE_ENV === 'development') {
  console.log('Token generated');
}
```

### ২. Password Hashing

```typescript
// ✅ সবসময় bcrypt ব্যবহার করুন
const hashedPassword = await bcrypt.hash(password, 10);

// ❌ Plain text password কখনো save করবেন না
user.password = plainPassword; // NEVER DO THIS
```

### ৩. Error Messages

```typescript
// ❌ খারাপ - Detailed error (security risk)
throw new UnauthorizedException('Password incorrect for user@example.com');

// ✅ ভালো - Generic error
throw new UnauthorizedException('Invalid credentials');
```

### ৪. Environment Variables

```typescript
// ✅ সবসময় .env file ব্যবহার করুন
JWT_SECRET=random-secret-key-here

// ❌ Code এ hardcode করবেন না
const secret = 'my-secret-123'; // NEVER DO THIS
```

---

## 🎯 সংক্ষিপ্ত সারমর্ম

### Public Route বানাতে:
```typescript
@Public()
@Get()
publicRoute() { }
```

### Authenticated Route (কোন decorator লাগবে না):
```typescript
@Get()
authenticatedRoute() { }
```

### Admin Only:
```typescript
@Roles(Role.ADMIN)
@Get()
adminRoute() { }
```

### Customer Only:
```typescript
@Roles(Role.CUSTOMER)
@Post()
customerRoute() { }
```

### Multiple Roles:
```typescript
@Roles(Role.ADMIN, Role.CUSTOMER)
@Get()
multiRoleRoute() { }
```

---

## 🙏 সমাপ্তি

এই ডকুমেন্টে আপনি শিখলেন:
- ✅ Authentication কি এবং কিভাবে কাজ করে
- ✅ Authorization এবং Role-based access control
- ✅ JWT Token কিভাবে ব্যবহার করতে হয়
- ✅ Guards এবং Decorators
- ✅ সম্পূর্ণ implementation ধাপে ধাপে
- ✅ Testing এবং debugging

এখন আপনি নিজের প্রজেক্টে authentication ও authorization implement করতে পারবেন! 🎉

**প্রশ্ন থাকলে বা সমস্যা হলে আবার জিজ্ঞেস করুন। Happy Coding! 💻**

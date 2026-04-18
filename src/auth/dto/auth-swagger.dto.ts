import { ApiProperty } from '@nestjs/swagger';

export class AuthUserInRegisterDataSwaggerDto {
  @ApiProperty({ example: '3fc5d831-e790-433d-aefa-8291e9a2c6c2' })
  id: string;

  @ApiProperty({ example: 'ada@example.com' })
  email: string;

  @ApiProperty({ example: '+2348012345678' })
  phoneNumber: string;

  @ApiProperty({ example: 'Ada' })
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  lastName: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;
}

/** Payload inside `data` for POST /auth/register (profile fields + token; envelope adds success + message). */
export class RegisterInnerDataSwaggerDto extends AuthUserInRegisterDataSwaggerDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZmM1ZDgzMS1lNzkwLTQzM2QtYWVmYS04MjkxZTlhMmM2YzIiLCJlbWFpbCI6ImFkYUBleGFtcGxlLmNvbSIsImlhdCI6MTc3NjQyNjQwMSwiZXhwIjoxNzc2NTEyODAxfQ.signature',
  })
  accessToken: string;
}

export class RegisterSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User registered successfully' })
  message: string;

  @ApiProperty({ type: RegisterInnerDataSwaggerDto })
  data: RegisterInnerDataSwaggerDto;
}

export class LoginInnerDataSwaggerDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOTcxZjhhOS1iN2U4LTQ3YjUtODI4Yy0zYzRiN2U2ZjgzYTciLCJlbWFpbCI6ImFkYUBleGFtcGxlLmNvbSIsImlhdCI6MTc3NjMzODc3MSwiZXhwIjoxNzc2NDI1MTcxfQ.signature',
  })
  accessToken: string;
}

export class LoginSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User logged in successfully' })
  message: string;

  @ApiProperty({ type: LoginInnerDataSwaggerDto })
  data: LoginInnerDataSwaggerDto;
}

import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDataSwaggerDto {
  @ApiProperty({ example: '1971f8a9-b7e8-47b5-828c-3c4b7e6f83a7' })
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

export class GetMeSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User profile fetched successfully' })
  message: string;

  @ApiProperty({ type: UserProfileDataSwaggerDto })
  data: UserProfileDataSwaggerDto;
}

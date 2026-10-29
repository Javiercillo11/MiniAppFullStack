import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role, UserStatus } from '../user-role.enum';

@Schema({
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      delete ret.tokenVersion;
      return ret;
    },
  },
})
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  phone: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.Viewer })
  role: Role;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.Active })
  status: UserStatus;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  // Obliga a cambiar la contraseña en el siguiente acceso
  @Prop({ default: false })
  mustChangePassword: boolean;

  // Se incrementa para invalidar todos los tokens emitidos
  @Prop({ default: 0, select: false })
  tokenVersion: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

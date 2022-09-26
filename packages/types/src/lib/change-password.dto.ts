export class ChangePasswordDto {
    id: string;
    prevPassword: string;
    newPassword: string;
    newPasswordRepeat: string;
}
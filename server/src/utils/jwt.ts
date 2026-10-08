import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"

export function generateAccessToken(id: number) {
    const token = jwt.sign(
        { id },
        process.env.JWT_SECRET!,
        { expiresIn: '15min' }
    )
    return token
}

export function generateRefreshToken(id: number){
    const token = jwt.sign(
        { id },
        process.env.JWT_SECRET!,
        { expiresIn: '28d' }
    )
    return token
}

export function verifyRefreshToken(token: string): string | JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!)
}
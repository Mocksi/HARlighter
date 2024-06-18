import { v4 as uuidv4 } from 'uuid';

export class UUIDGenerator {
    generate(): string {
        return uuidv4();
    }
}
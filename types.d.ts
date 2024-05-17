import { Readable } from 'stream';

declare global {
    interface Date {
        formatDate(): string;
    }
    type EmbedFiles = [
        {
            name: string,
            attachment: Readable
        }
    ]
}
export { }

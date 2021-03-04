export default interface IOptions {
	ak?: string;
    sk?: string;
    bucket: string;
    region: string;
	retry?: number;
	publicPath?: string;
    // 多账号支持
    account?: string;
	exclude?: (file: string) => boolean;
}
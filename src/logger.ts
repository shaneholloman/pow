import chalk from "chalk";

export const log = {
    info: (msg: string) => console.log(chalk.blue("INFO"), msg),
    success: (msg: string) => console.log(chalk.green("SUCCESS"), msg),
    warning: (msg: string) => console.log(chalk.yellow("WARNING"), msg),
    error: (msg: string) => console.log(chalk.red("ERROR"), msg),
    action: (msg: string) => console.log(chalk.cyan("ACTION"), msg),
};

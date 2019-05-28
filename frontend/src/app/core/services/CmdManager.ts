
export interface ICommand {
    name?: string;
    state?: any;
    execute: () => any;
    unexcute: () => any;
}

export class CmdManager {
    private commands: ICommand[] = [];

    public getLastCommand() {
       if (this.commands.length > 0) {
           return this.commands[this.commands.length - 1];
       }
       return undefined;
    }

    public execute(cmd: ICommand) {
        cmd.execute();
        this.commands.push(cmd);
    }


    public undo() {
        const cmd = this.commands.pop();
        if (cmd !== undefined && cmd.unexcute !== undefined) {
            cmd.unexcute();
        }
    }
}

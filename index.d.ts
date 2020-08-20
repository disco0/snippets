import { CopyPlugin } from 'copy-webpack-plugin';
// import {  } from 'stylus-native-loader'

export interface CopyPlugin { 
    new (options?: CopyPluginOptions | ReadonlyArray<StringPattern | ObjectPattern>): Plugin;
}

declare global {
    export interface CopyPlugin { 
        new (options?: CopyPluginOptions | ReadonlyArray<StringPattern | ObjectPattern>): Plugin;
    }
}
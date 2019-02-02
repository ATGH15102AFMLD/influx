export { default as ParserParameters } from './ParserParameters';
export { default as ASTView } from './ASTView';
export { default as SourceEditor } from './SourceEditor';
export { default as ProgramView } from './ProgramView';
export { default as FileListView } from './FileListView';
export { default as MemoryView } from './MemoryView';
export { default as BytecodeView } from './BytecodeView';

// temp definition for react-jss compatibility
export interface IWithStyles<T> {
    classes?: {
        [P in keyof T]: string;
    }
};


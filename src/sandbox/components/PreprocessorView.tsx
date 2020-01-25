import { IMacro } from '@lib/idl/parser/IMacro';
import { IRange } from '@lib/idl/parser/IParser';
import * as path from '@lib/path/path';
import { getCommon, mapProps } from '@sandbox/reducers';
import IStoreState from '@sandbox/store/IStoreState';
import * as React from 'react';
import { connect } from 'react-redux';
import { List } from 'semantic-ui-react';

export interface IPPViewProps extends IStoreState {

}

class PPView extends React.Component<IPPViewProps, {}> {
    state: {
        // nodeStats: IMap<{ opened: boolean; selected: boolean; }>;
        showIncludes: boolean;
        showMacros: boolean;
        showUnreachableCode: boolean;
    };

    rootRef: React.RefObject<HTMLDivElement>;

    constructor(props: IPPViewProps) {
        super(props);
        this.state = {
            showIncludes: false,
            showMacros: false,
            showUnreachableCode: false
        };

        this.rootRef = React.createRef();
    }

    render(): JSX.Element {
        const slastDocument = this.props.sourceFile.slastDocument;

        if (!slastDocument) {
            return null;
        }

        const includes = slastDocument.includes;
        const macros = slastDocument.macros;
        const unresolvedMacros = slastDocument.unresolvedMacros;
        const unreachableCode = slastDocument.unreachableCode;

        const { showIncludes, showMacros, showUnreachableCode } = this.state;

        const style = {
            height: 'calc(100vh - 205px)',
            overflowY: 'auto'
        };

        return (
            <div ref={ this.rootRef }>
                <List style={ style } selection size='small' className='astlist' >
                    <List.Item key={ `pp-include-list` } className='astnode'
                        onClick={ () => this.setState({ showIncludes: !showIncludes }) }
                    >
                        <List.Icon name={ (showIncludes ? `chevron down` : `chevron right`) } />
                        <List.Content>
                            <List.Header>{ 'Include list' }</List.Header>
                            { this.renderIncludes([...includes.keys()]) }
                        </List.Content>
                    </List.Item>
                    <List.Item key={ `pp-macros` } className='astnode'
                        onClick={ () => this.setState({ showMacros: !showMacros }) }
                    >
                        <List.Icon name={ (showMacros ? `chevron down` : `chevron right`) } />
                        <List.Content>
                            <List.Header>{ 'Macro list' }</List.Header>
                            { this.renderMacros(macros.concat(unresolvedMacros)) }
                        </List.Content>
                    </List.Item>
                    <List.Item key={ `pp-unreachable-code` } className='astnode'
                        onClick={ () => this.setState({ showUnreachableCode: !showUnreachableCode }) }
                    >
                        <List.Icon name={ (showUnreachableCode ? `chevron down` : `chevron right`) } />
                        <List.Content>
                            <List.Header>{ 'Unreachable regions' }</List.Header>
                            { this.renderUnreachableRegions(unreachableCode) }
                        </List.Content>
                    </List.Item>
                </List>
            </div>
        );
    }


    renderIncludes(includes: string[]): JSX.Element {
        if (!this.state.showIncludes) {
            return null;
        }

        const items = includes.map((filename, i) => (
            <List.Item key={ `pp-include-${i}` }
                // onClick={ this.handleNodeClick.bind(this, idx, node) }
                // onMouseOver={ this.handleNodeOver.bind(this, idx, node) }
                // onMouseOut={ this.handleNodeOut.bind(this, idx, node) }
                className='astnode'
            >
                <List.Content>
                    {/* <List.Header>{ filename }</List.Header> */ }
                    <List.Description>{ path.normalize(filename) }</List.Description>
                </List.Content>
            </List.Item>
        ));

        return (
            <List.List className='astlist'>
                { items }
            </List.List>
        );
    }


    renderMacros(macros: IMacro[]): JSX.Element {
        if (!this.state.showMacros) {
            return null;
        }

        if (macros.length == 0) {
            return null;
        }

        return (
            <List.List className='astlist'>
                {
                    macros.filter(macro => macro.bRegionExpr).map((macro, i) => (
                        <List.Item key={ `pp-macro-${i}` }
                            // onClick={ this.handleNodeClick.bind(this, idx, node) }
                            // onMouseOver={ this.handleNodeOver.bind(this, idx, node) }
                            // onMouseOut={ this.handleNodeOut.bind(this, idx, node) }
                            className='astnode'
                        >
                            <List.Content>
                                {/* <List.Header>{ filename }</List.Header> */ }
                                <List.Description>{ macro.name }</List.Description>
                            </List.Content>
                        </List.Item>
                    ))
                }
                <List.Item key={ `pp-macros-other` } className='astnode'
                // onClick={ () => this.setState({ showUnreachableCode: !showUnreachableCode }) }
                >
                    <List.Icon name={ (true ? `chevron down` : `chevron right`) } />
                    <List.Content>
                        <List.Header>{ 'other...' }</List.Header>
                        {
                            macros.filter(macro => !macro.bRegionExpr).map((macro, i) => (
                                <List.Item key={ `pp-macro-${i}` }
                                    // onClick={ this.handleNodeClick.bind(this, idx, node) }
                                    // onMouseOver={ this.handleNodeOver.bind(this, idx, node) }
                                    // onMouseOut={ this.handleNodeOut.bind(this, idx, node) }
                                    className='astnode'
                                >
                                    <List.Content>
                                        {/* <List.Header>{ filename }</List.Header> */ }
                                        <List.Description>{ macro.name }</List.Description>
                                    </List.Content>
                                </List.Item>
                            ))
                        }
                    </List.Content>
                </List.Item>
            </List.List>
        );
    }


    renderUnreachableRegions(regions: IRange[]): JSX.Element {
        if (!this.state.showUnreachableCode) {
            return null;
        }

        const items = regions.map(({ start, end }, i) => (
            <List.Item key={ `pp-include-${i}` }
                // onClick={ this.handleNodeClick.bind(this, idx, node) }
                // onMouseOver={ this.handleNodeOver.bind(this, idx, node) }
                // onMouseOut={ this.handleNodeOut.bind(this, idx, node) }
                className='astnode'
            >
                <List.Content>
                    {/* <List.Header>{ filename }</List.Header> */ }
                    <List.Description>{ path.parse(start.file.toString()).filename }{ ` (${start.line} - ${end.line})` }</List.Description>
                </List.Content>
            </List.Item>
        ));

        return (
            <List.List className='astlist'>
                { items }
            </List.List>
        );
    }

}

export default connect<{}, {}, IPPViewProps>(mapProps(getCommon), {})(PPView) as any;
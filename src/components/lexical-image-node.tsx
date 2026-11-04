import {
    $create,
    $getDocument,
    $getState,
    $setState,
    createState,
    DecoratorNode,
    DOMConversionOutput,
    DOMExportOutput,
    type LexicalNode,
} from 'lexical';
import {ReactNode} from 'react';

const srcState = createState('src', {parse: String});

export class ImageNode extends DecoratorNode<ReactNode> {
    $config() {
        return this.config('friendly:image', {
            extends: DecoratorNode,
            stateConfigs: [{flat: true, stateConfig: srcState}],
            importDOM: {
                img: () => ({
                    conversion: (element): DOMConversionOutput => {
                        const src = element.getAttribute('src');
                        const node = $createImageNode(src ?? 'broken');
                        return {node};
                    },
                    priority: 0,
                }),
            },
        });
    }

    createDOM(): HTMLElement {
        return $getDocument().createElement('div');
    }

    updateDOM(): false {
        return false;
    }

    isInline(): true {
        return true;
    }

    decorate(): ReactNode {
        return <img className="rounded-lg" src={this.$getSrc()} />;
    }

    exportDOM(): DOMExportOutput {
        const element = $getDocument().createElement('img');
        element.setAttribute('src', this.$getSrc());
        return {element};
    }

    $setSrc(value: string): this {
        return $setState(this, srcState, value);
    }

    $getSrc(): string {
        return $getState(this, srcState);
    }
}

export function $createImageNode(src: string): ImageNode {
    return $setState($create(ImageNode), srcState, src);
}

export function $isImageNode(
    node: LexicalNode | null | undefined,
): node is ImageNode {
    return node instanceof ImageNode;
}

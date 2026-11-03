import {
    $create,
    $getDocument,
    $getState,
    $setState,
    createState,
    DecoratorNode,
    type LexicalNode,
} from 'lexical';
import {ReactNode} from 'react';

const srcState = createState('src', {parse: String});

export class ImageNode extends DecoratorNode<ReactNode> {
    $config() {
        return this.config('friendly:image', {
            extends: DecoratorNode,
            stateConfigs: [{flat: true, stateConfig: srcState}],
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
        return <img className="rounded-lg" src={$getState(this, srcState)} />;
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

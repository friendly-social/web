function setNewLexicalJson(value: string | null) {
    if (value) {
        localStorage.setItem('new-post.lexical-json', value);
    } else {
        localStorage.removeItem('new-post.lexical-json');
    }
}

function getNewLexicalJson(): string | null {
    return localStorage.getItem('new-post.lexical-json');
}

function getReplyLexicalJson(): string | null {
    return sessionStorage.getItem('reply.lexical-json');
}

function setReplyLexicalJson(value: string | null) {
    if (value) {
        sessionStorage.setItem('reply.lexical-json', value);
    } else {
        sessionStorage.removeItem('reply.lexical-json');
    }
}

export const newPost = {
    setNewLexicalJson,
    getNewLexicalJson,
    setReplyLexicalJson,
    getReplyLexicalJson,
};

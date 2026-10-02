export function hasTextSelection(): boolean {
    return window.getSelection()?.isCollapsed === false;
}

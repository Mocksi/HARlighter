import { MOCKSI_HIGHLIGHTER_ID } from "../../consts"

class Highlighter {
    private contentRanger = document.createRange()
    private highlighterContainer;
    constructor(
        highlighterContainer: HTMLElement
    ) {
        this.highlighterContainer = highlighterContainer
    }

    highlightNode = (elementToHighlight: Text) => {
        this.contentRanger.selectNodeContents(elementToHighlight)
        const {x, y, width, height} = this.contentRanger.getBoundingClientRect() || {}
        console.log(this.contentRanger.getBoundingClientRect())
        document.body.appendChild(
            highlight({x, y, width, height})
        )
    }

    hideHighlights = () => {
        for (let node of [...this.highlighterContainer.childNodes]) {
            (node as HTMLElement).style.display = 'none'
        }
    }
}

export let ContentHighlighter: Highlighter;

export const initHighlighter = () => {
    if (!document.getElementById(MOCKSI_HIGHLIGHTER_ID)) {
        const highlighterDiv = getHighlighterContainer()
        document.body.appendChild(
            highlighterDiv
        )
        ContentHighlighter = new Highlighter(highlighterDiv)
    }
}


const getHighlighterContainer = () => {
    const highlighterDiv = document.createElement('div')
    highlighterDiv.id = MOCKSI_HIGHLIGHTER_ID
    highlighterDiv.style.width = '100%'
    highlighterDiv.style.height = '100%'
    highlighterDiv.style.position = 'absolute'
    highlighterDiv.style.zIndex = '999'
    return highlighterDiv
    
}

const highlight = ({x, y, width, height}: {x: number, y: number, width: number, height: number}) => {
    const highlightDiv = document.createElement('div')
    highlightDiv.style.position = 'absolute'
    highlightDiv.style.top = `${window.scrollY + y + -2}px`
    highlightDiv.style.left = `${window.scrollX + x + -2}px`
    // 4px more because we're removing 2px each side because of the border
    highlightDiv.style.width = `${width + 4}px`
    highlightDiv.style.height = `${height + 4}px`
    highlightDiv.style.border = '2px solid purple'
    highlightDiv.style.backgroundColor = 'transparent'
    return highlightDiv

}




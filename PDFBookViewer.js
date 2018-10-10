import React from 'react'

import pdfjsLib from 'pdfjs-dist'

import PDFBookPage from './PDFBookPage'

const zoomFactor = 2.5

export default class PDFBookViewer extends React.Component {
  constructor(props) {
    super(props)

    pdfjsLib.GlobalWorkerOptions.workerSrc = props.workerSrc

    this.containerRef = React.createRef()
    this.bookRef = React.createRef()

    this.pdf = null
    this.numPages = 0
    this.pageScale = 0
    this.width = 0
    this.height = 0

    this.state = {
      page: 1,
      forward: true,
      isZoomed: false,
      isDragging: false,
      lastPosition: [0, 0],
      currentPosition: [0, 0],
      pages: [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    }
  }

  componentDidMount() {
    pdfjsLib.getDocument(this.props.url)
      .then(pdf => {
        pdf.getPage(1).then(page => {
          let viewport = page.getViewport(1)

          const containerHeight = this.containerRef.current.offsetHeight
          const pageScale = (containerHeight - 30) / viewport.height * zoomFactor

          viewport = page.getViewport(pageScale)

          this.pdf = pdf
          this.numPages = pdf.numPages
          this.pageScale = pageScale
          this.height = viewport.height
          this.width = viewport.width

          this.setState({
            pages: [
              null,                                                  // Left prev 2
              null,                                                  // Right prev 2
              null,                                                  // Left prev 1
              null,                                                  // Right prev 1
              null,                                                  // Left curr
              <PDFBookPage key={1} page={page} scale={pageScale} />, // Right curr
              null,                                                  // Left next 1
              null,                                                  // Right next 1
              null,                                                  // Left next 2
              null,                                                  // Right next 2
            ]
          }, () => {
            Promise.all([
              pdf.getPage(2),
              pdf.getPage(3),
              pdf.getPage(4),
              pdf.getPage(5),
            ]).then(pages => {
              this.setState({
                pages: [
                  null,                                                           // Left prev 2
                  null,                                                           // Right prev 2
                  null,                                                           // Left prev 1
                  null,                                                           // Right prev 1
                  null,                                                           // Left curr
                  this.state.pages[5],                                            // Right curr
                  <PDFBookPage key={2} page={pages[0]} scale={this.pageScale} />, // Left next 1
                  <PDFBookPage key={3} page={pages[1]} scale={this.pageScale} />, // Right next 1
                  <PDFBookPage key={4} page={pages[2]} scale={this.pageScale} />, // Left next 2
                  <PDFBookPage key={5} page={pages[3]} scale={this.pageScale} />, // Right next 2
                ]
              })
            })
          })
        })
      })
  }

  updatePage(index, page) {
    const pages = this.state.pages

    pages[index] = (
      <PDFBookPage key={page.pageIndex+1} page={page} scale={this.pageScale} />
    )

    this.setState({pages: pages})
  }

  nextPage() {
    this.setState({
      page: this.state.page == 1 ? 2 : this.state.page + 2,
      forward: true,
      pages: [
        this.state.pages[2],
        this.state.pages[3],
        this.state.pages[4],
        this.state.pages[5],
        this.state.pages[6],
        this.state.pages[7],
        this.state.pages[8],
        this.state.pages[9],
        null,
        null
      ]
    }, () => {
      this.pdf.getPage(this.state.page + 4)
        .then(page => this.updatePage(8, page))

      this.pdf.getPage(this.state.page + 5)
          .then(page => this.updatePage(9, page))
    })
  }

  prevPage() {
    if (this.state.page <= 1) {
      return
    }

    this.setState({
      page: this.state.page == 2 ? 1 : this.state.page - 2,
      forward: false,
      pages: [
        null,
        null,
        this.state.pages[0],
        this.state.pages[1],
        this.state.pages[2],
        this.state.pages[3],
        this.state.pages[4],
        this.state.pages[5],
        this.state.pages[6],
        this.state.pages[7],
      ]
    }, () => {
      if (this.state.page - 4 >= 1) {
        this.pdf.getPage(this.state.page - 4)
          .then(page => this.updatePage(0, page))
      }

      if (this.state.page - 3 >= 1) {
        this.pdf.getPage(this.state.page - 3)
          .then(page => this.updatePage(1, page))
      }
    })
  }

  getZoomPosition(e) {
    const box = this.bookRef.current.getBoundingClientRect()

    const posX = e.pageX - box.left
    const posY = e.pageY - box.top

    const xRatio = (0.5 - (posX / box.width)) * 100
    const yRatio = (0.5 - (posY / box.height)) * 100

    return [xRatio, yRatio]
  }

  toggleZoom(e) {
    if (this.state.isZoomed) {
      this.setState({
        isZoomed: false,
        currentPosition: [0, 0],
      })
    } else {
      this.setState({
        isZoomed: true,
        currentPosition: this.getZoomPosition(e)
      })
    }
  }

  startDragging(e) {
    if (!this.state.isZoomed) {
      return
    }

    this.setState({ 
      isDragging: true,
      lastPosition: [e.pageX, e.pageY]
    })
  }

  stopDragging(e) {
    this.setState({ isDragging: false })
  }

  onMouseMove(e) {
    if (!this.state.isZoomed || !this.state.isDragging) {
      return
    }

    const box = this.bookRef.current.getBoundingClientRect()

    const curX = e.pageX
    const curY = e.pageY

    const [lastX, lastY] = this.state.lastPosition

    const xDelta = (curX-lastX) / box.width * 100
    const yDelta = (curY-lastY) / box.height * 100

    const [posX, posY] = this.state.currentPosition

    const newX = posX + xDelta
    const newY = posY + yDelta

    this.setState({
      currentPosition: [newX, newY],
      lastPosition: [curX, curY]
    })
  }

  onDoubleClick(e) {
    this.toggleZoom(e)
  }

  render() {
    const scale = this.state.isZoomed ? 1 : 1 / zoomFactor

    const [posX, posY] = this.state.currentPosition

    const bookStyle = {
      transform: `scale(${scale}) translate(${posX}%, ${posY}%)`,
      cursor: this.state.isZoomed ? 'grab' : 'default',
      width: this.width * 2,
    }

    const pageStyle = {
      width: this.width,
      height: this.height,
    }

    const prevButton = <button className='c-nav c-nav--prev' onClick={() => this.prevPage()}></button>
    const nextButton = <button className='c-nav c-nav--next' onClick={() => this.nextPage()}></button>

    return (
      <div 
        className='c-pdf-book-viewer'
        onMouseUp={(e) => this.stopDragging(e)}
        onMouseMove={(e) => this.onMouseMove(e)}>
        <div className='c-pdf-container' ref={this.containerRef}>
          <div
            className={getBookClassNames(this.state, this.numPages)}
            ref={this.bookRef}
            style={bookStyle}
            onDoubleClick={(e) => this.onDoubleClick(e)}
            onMouseDown={(e) => this.startDragging(e)}>
            <div className='c-pdf-page c-pdf-page--left' style={pageStyle}>
              {this.state.pages[0]}
              {this.state.pages[8]}
              {this.state.forward ? this.state.pages[6] : this.state.pages[2]}
              {this.state.forward ? this.state.pages[2] : this.state.pages[6]}
              {this.state.pages[4]}
              {this.state.page == 1 ? <canvas></canvas> : null}
            </div>
            <div className='c-pdf-page c-pdf-page--right' style={pageStyle}>
              {this.state.pages[1]}
              {this.state.pages[9]}
              {this.state.forward ? this.state.pages[7] : this.state.pages[3]}
              {this.state.forward ? this.state.pages[3] : this.state.pages[7]}
              {this.state.pages[5]}
            </div>
          </div>
          {this.state.page > 1 && !this.state.isZoomed && prevButton}
          {this.state.page < this.numPages && !this.state.isZoomed && nextButton}
        </div>
      </div>
    )
  }
}

function getBookClassNames(state, numPages) {
  const classNames = [
    'c-pdf-book',
    `c-pdf-book--dir-${state.forward ? 'forward' : 'backward'}`,
    `c-pdf-book--page-${state.page}`,
  ]

  if (state.page === numPages) {
    classNames.push('c-pdf-book--last')
  }

  if (state.isDragging) {
    classNames.push('c-pdf-book--dragging')
  }

  return classNames.join(' ')
}

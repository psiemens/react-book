import React from 'react';

import pdfjsLib from 'pdfjs-dist';

import ReactPanZoom from '@ajainarayanan/react-pan-zoom';

import PDFBookPage from './PDFBookPage';

export default class PDFBookViewer extends React.Component {
  constructor(props) {
    super(props);

    pdfjsLib.GlobalWorkerOptions.workerSrc = props.workerSrc;

    this.containerRef = React.createRef();
    this.bookRef = React.createRef();

    this.state = {
      pdf: null,
      page: 1,
      numPages: 0,
      width: 0,
      height: 0,
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
      ],
    }
  }

  componentDidMount() {
    pdfjsLib.getDocument(this.props.url)
      .then(pdf => {
        pdf.getPage(1).then(page => {
          let viewport = page.getViewport(1);

          const containerHeight = this.containerRef.current.offsetHeight;
          const pageScale = (containerHeight - 30) / viewport.height * 2;

          viewport = page.getViewport(pageScale);

          this.setState({
            pdf: pdf,
            scale: pageScale,
            height: viewport.height,
            width: viewport.width,
            numPages: pdf.numPages,
            pages: [
              null,                                              // Left prev 2
              null,                                              // Right prev 2
              null,                                              // Left prev 1
              null,                                              // Right prev 1
              null,                                              // Left curr
              <PDFBookPage key={1} page={page} scale={pageScale} />, // Right curr
              null,                                              // Left next 1
              null,                                              // Right next 1
              null,                                              // Left next 2
              null,                                              // Right next 2
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
                  null,                                                         // Left prev 2
                  null,                                                         // Right prev 2
                  null,                                                         // Left prev 1
                  null,                                                         // Right prev 1
                  null,                                                         // Left curr
                  this.state.pages[5],                                          // Right curr
                  <PDFBookPage key={2} page={pages[0]} scale={this.state.scale} />, // Left next 1
                  <PDFBookPage key={3} page={pages[1]} scale={this.state.scale} />, // Right next 1
                  <PDFBookPage key={4} page={pages[2]} scale={this.state.scale} />, // Left next 2
                  <PDFBookPage key={5} page={pages[3]} scale={this.state.scale} />, // Right next 2
                ]
              })
            })
          })
        })
      });
  }

  nextPage() {
    this.setState({
      page: this.state.page == 1 ? this.state.page + 1 : this.state.page + 2,
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
      this.state.pdf.getPage(this.state.page + 4)
        .then(page => {
          let pages = this.state.pages;
          pages[8] = (
            <PDFBookPage key={page.pageIndex+1} page={page} scale={this.state.scale} />
          )

          this.setState({pages: pages})
        })

      this.state.pdf.getPage(this.state.page + 5)
        .then(page => {
          let pages = this.state.pages;
          pages[9] = (
            <PDFBookPage key={page.pageIndex+1} page={page} scale={this.state.scale} />
          )
          this.setState({pages: pages})
        })
    })
  }

  prevPage() {
    if (this.state.page <= 1) {
      return
    }

    this.setState({
      page: this.state.page == 2 ? this.state.page - 1 : this.state.page - 2,
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
        this.state.pdf.getPage(this.state.page - 4)
          .then(page => {
            let pages = this.state.pages;
            pages[0] = (
              <PDFBookPage key={page.pageIndex+1} page={page} scale={this.state.scale} />
            )

            this.setState({pages: pages})
          })
      }

      if (this.state.page - 3 >= 1) {
        this.state.pdf.getPage(this.state.page - 3)
          .then(page => {
            let pages = this.state.pages;
            pages[1] = (
              <PDFBookPage key={page.pageIndex+1} page={page} scale={this.state.scale} />
            )
            this.setState({pages: pages})
          })
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
        currentPosition: [0, 0]
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

    this.setState({
      currentPosition: [posX + xDelta, posY + yDelta],
      lastPosition: [curX, curY]
    })
  }

  onClick(e) {
    if (this.state.isZoomed) {
      return
    }

    this.toggleZoom(e)
  }

  onDoubleClick(e) {
    if (!this.state.isZoomed) {
      return
    }

    this.toggleZoom(e)
  }

  render() {
    const scale = this.state.isZoomed ? 1 : 0.5;

    const [zoomX, zoomY] = this.state.currentPosition

    const bookStyle = {
      transform: `scale(${scale}) translate(${zoomX}%, ${zoomY}%)`,
      width: this.state.width * 2,
      cursor: this.state.isZoomed ? 'grab' : 'zoom-in',
    }

    const pageStyle = {
      width: this.state.width,
      height: this.state.height,
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
            className={getBookClassNames(this.state)}
            ref={this.bookRef}
            style={bookStyle}
            onClick={(e) => this.onClick(e)}
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
          {this.state.page < this.state.numPages && !this.state.isZoomed && nextButton}
        </div>
      </div>
    )
  }
}

function getBookClassNames(state) {
  const classNames = [
    'c-pdf-book',
    `c-pdf-book--dir-${state.forward ? 'forward' : 'backward'}`,
    `c-pdf-book--page-${state.page}`,
  ]

  if (state.isZoomed) {
    classNames.push('c-pdf-book--zoomed')
  }

  if (state.page === state.numPages) {
    classNames.push('c-pdf-book--last')
  }

  return classNames.join(' ')
}

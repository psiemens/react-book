import React from 'react';

import pdfjsLib from 'pdfjs-dist';

import PDFBookPage from './PDFBookPage';

export default class PDFBookViewer extends React.Component {
  constructor(props) {
    super(props);

    pdfjsLib.GlobalWorkerOptions.workerSrc = props.workerSrc;

    this.containerRef = React.createRef();

    this.state = {
      pdf: null,
      page: 1,
      containerWidth: 0,
      width: 0,
      height: 0,
      forward: true,
      isZoomed: false,
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

          const containerHeight = this.containerRef.current.clientHeight;
          const pageScale = containerHeight / viewport.height * 2;

          viewport = page.getViewport(pageScale);

          this.setState({
            pdf: pdf,
            scale: pageScale,
            containerWidth: this.containerRef.current.offsetWidth,
            height: viewport.height,
            width: viewport.width,
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

  zoom() {
    this.setState({
      isZoomed: !this.state.isZoomed
    })
  }

  render() {
    const scale = this.state.isZoomed ? 2 : 1;

    const bookStyle = {
      width: this.state.page > 1 ? this.state.width * 2 : this.state.width * 2,
      left: (this.state.containerWidth / 2) - (this.state.width * scale / 2),
    }

    const pageStyle = {
      width: this.state.width,
      height: this.state.height,
    }

    return (
      <div className='container'>
        <div>
          <button onClick={() => this.prevPage()}>Prev</button>
          <button onClick={() => this.nextPage()}>Next</button>
          <button onClick={() => this.zoom()}>Zoom</button>
        </div>
        <div className='pdf-container' ref={this.containerRef}>
          <div className={`pdf-book pdf-direction--${this.state.forward ? 'forward' : 'backward'} pdf-book--page-${this.state.page} pdf-book--${this.state.isZoomed ? 'zoomed' : 'not-zoomed'}`} style={bookStyle}>
            <div className='pdf-page pdf-page--left' style={pageStyle}>
              {this.state.pages[0]}
              {this.state.pages[8]}
              {this.state.forward ? this.state.pages[6] : this.state.pages[2]}
              {this.state.forward ? this.state.pages[2] : this.state.pages[6]}
              {this.state.pages[4]}
              {this.state.page == 1 ? <canvas></canvas> : null}
            </div>
            <div className='pdf-page pdf-page--right' style={pageStyle}>
              {this.state.pages[1]}
              {this.state.pages[9]}
              {this.state.forward ? this.state.pages[7] : this.state.pages[3]}
              {this.state.forward ? this.state.pages[3] : this.state.pages[7]}
              {this.state.pages[5]}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

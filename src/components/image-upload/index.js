/*
  This Sweep component allows user to upload an image to the P2WDB pinning cluster.
*/

// Global npm libraries
import React, { useRef, useState } from 'react'
import { Container, Row, Col, Form, Button, Modal, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import Sweep from 'bch-token-sweep'
import UppyHandler from './uppy-handler.js'
import UploadStatus from './upload-status'

let uppyRef

const SERVER = process.env.REACT_APP_SERVER

function ImageUpload (props) {
  const { appData } = props

  uppyRef = useRef()
  console.log('ImageUpload() uppyRef: ', uppyRef)

  // Generate a serial number for this upload session.
  const [sn, setSn] = useState(Math.floor(Math.random() * Math.pow(10, 5)))
  console.log('File upload serial number: ', sn)

  const [uploadHasFinished, setUploadHasFinished] = useState(false)
  appData.uploadHasFinished = uploadHasFinished
  appData.setUploadHasFinished = setUploadHasFinished

  const flagUploadAsFinished = () => {
    console.log('FlagUploadAsFinished() executed')
    setUploadHasFinished(true)
  }

  return (
    <>
      <Container>
        <Row>
          <Col style={{ textAlign: 'right' }}>
            <a href='https://youtu.be/QW9xixHaEJE' target='_blank' rel='noreferrer'>
              <FontAwesomeIcon icon={faCircleQuestion} size='lg' />
            </a>
          </Col>
        </Row>

        <Row>
          <Col>
            <p>
              This view allows you to upload an image to the IPFS network. Only
              image files under 1 MB are currently supported. Hosting of the
              image lasts for one year, and costs approximately $0.01 per file.
            </p>
          </Col>
        </Row>

        <Row>
          <Col>
            <UppyHandler
              ref={uppyRef}
              onChange={(OriginalFile) => {
                uppyOnChngeHandle(OriginalFile)
              }}
              appData={appData}
              sn={sn}
            />
          </Col>
        </Row>

        <Row>
          <Col style={{ padding: '25px' }}>
            <Button variant='info' onClick={(e) => handleUpload({ appData, sn, flagUploadAsFinished })}>Upload</Button>
          </Col>
        </Row>

        <Row>
          <Col>
            <UploadStatus appData={appData} sn={sn} uploadHasFinished={uploadHasFinished} />
          </Col>
        </Row>

      </Container>

    </>
  )
}

async function handleUpload ({ appData, sn, flagUploadAsFinished }) {
  console.log('handleUpload() appData: ', appData)
  console.log('handleUpload() uppyRef: ', uppyRef)
  console.log('handleUpload() sn: ', sn)

  try {
    const balance = await appData.wallet.getBalance()
    console.log('balance: ', balance)

    // get loaded files
    const hasLoadedFiles = uppyRef.current.hasLoadedFiles()
    const fileData = uppyRef.current.getFileData()
    console.log('fileData: ', fileData)

    const uppyResult = await uppyRef.current.submitFiles()
    console.log('uppyResult: ', uppyResult)
    if (!uppyResult) {
      throw new Error('Error uploading files')
    }

    // Signal that the upload has completed and pin monitoried can begin.
    console.log('handleUpload(): setting upload as finished.')
    flagUploadAsFinished()

    // appData.imageUpload.setShowStatusStr(true)
  } catch (err) {
    console.error('Error in handleUpload(): ', err)
  }
}

async function uppyOnChngeHandle (OriginalFile) {
  // validateFormValues() // validate required file
  // setPreviousValues(values) // force render
  // console.log('values: ', values)
  console.log('OriginalFile: ', OriginalFile)

  // if the file does not exist , clear the ref
  if (!OriginalFile) {
    // componentWillUnmountFileRef.current = null
    return
  }

  // ignore thumbnail file , just add to the ref the file uploaded by the user
  if (OriginalFile.meta && !OriginalFile.meta.isThumbnail) {
    const FileReader = window.FileReader
    const reader = new FileReader()

    reader.onload = function (e) {
      // get file blob
      const Blob = window.Blob
      const blob = new Blob([new Uint8Array(e.target.result)], {
        type: OriginalFile.type
      })

      if (blob) {
        try {
          // add file to cache and add url
          const urlCreator = window.URL || window.webkitURL
          const imageUrl = urlCreator.createObjectURL(blob)

          // set values to ref
          // componentWillUnmountFileRef.current = {
          //   type: OriginalFile.data.type,
          //   name: OriginalFile.name,
          //   url: imageUrl,
          //   size: OriginalFile.size,
          //   source: OriginalFile.source,
          //   extension: OriginalFile.extension
          // }
        } catch (error) {
          console.warn(error)
        }
      }
    }

    reader.readAsArrayBuffer(OriginalFile.data)
  }
}

export default ImageUpload

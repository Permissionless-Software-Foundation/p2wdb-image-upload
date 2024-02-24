/*
  This component displays data about the upload of the file.
*/

// Global npm libraries
import React, { useState } from 'react'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'

const SERVER = process.env.REACT_APP_SERVER

// let globalUploadHasFinished = false

function UploadStatus (props) {
  const { appData, sn } = props

  // Pass the uploadHasFinished value to a global variable so that it can
  // used in the timer interval function.
  // globalUploadHasFinished = uploadHasFinished

  // Showing status of upload
  const [statusStr, setStatusStr] = useState(
    <>
      <Spinner animation='border' />
      <p>Waiting for IPFS pinning to complete...</p>
    </>
  )
  const [showStatusStr, setShowStatusStr] = useState(false)

  appData.uploadStatus = {
    statusStr,
    setStatusStr,
    showStatusStr,
    setShowStatusStr
  }

  // Create a timer for checking the status of the file.
  // The useState feature ensure that only one timer is created, even when
  // the component is redrawn.
  const [checkFileHandle, setCheckFileHandle] = useState(false)
  if (!checkFileHandle) {
    const fileStatusHandle = setInterval(() => checkFile({ appData, sn }), 10000)
    setCheckFileHandle(fileStatusHandle)
  }

  return (
    <div style={{ padding: '25px' }}>
      {
        showStatusStr
          ? (
            <>
              {statusStr}
            </>
            )
          : null
      }
    </div>
  )
}

// Called by a timer interval. This checks the status of the file upload.
async function checkFile ({ appData, sn }) {
  try {
    const url = `${SERVER}/files/status/${sn}`

    // console.log('checkFile() globalUploadHasFinished: ', globalUploadHasFinished)
    // if (!globalUploadHasFinished) return

    const result = await axios.get(url)
    console.log('checkFile() result.data: ', result.data)

    const fileStatus = result.data.fileStatus
    console.log('fileStatus: ', fileStatus)

    if (fileStatus) {
      if (!fileStatus.dataPinned && fileStatus.cid === null) {
        // dataPinned === false, there was an error trying to create a pin claim.

        // Show the status after file upload has started.
        appData.uploadStatus.setShowStatusStr(true)

        appData.uploadStatus.setStatusStr(
          <>
            <p>Upload failed</p>
            <p>
              Your wallet must have BCH and PSF tokens. You can purchase PSF
              tokens at <a href='https://psfoundation.cash' target='_blank' rel='noreferrer'>
                PSFoundation.cash
                        </a>.
            </p>
          </>
        )
      } else if (!fileStatus.dataPinned) {
        // dataPinned = undefined, waiting for status update.

        // Show the status after file upload has started.
        appData.uploadStatus.setShowStatusStr(true)
      } else {
        // const filename = fileStatus.originalFile.desiredFileName
        const url = `https://pin.fullstack.cash/ipfs/download/${fileStatus.cid}`

        // const p2wdbUrl = `https://p2wdb.fullstack.cash/entry/hash/${fileStatus.p2wdbHash}`

        // Report details after pinning has completed.
        appData.uploadStatus.setStatusStr(
          <>
            <p>Upload complete!</p>
            <p>IPFS CID: {fileStatus.cid}</p>
            <p>
              <a href={url} target='_blank' rel='noreferrer'>{url}</a>
            </p>
          </>
        )
      }
    }
  } catch (err) {
    console.log('Error in checkFile()')
    throw err
  }
}

export default UploadStatus

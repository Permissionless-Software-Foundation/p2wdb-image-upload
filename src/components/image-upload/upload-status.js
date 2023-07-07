/*
  This component displays data about the upload of the file.
*/

// Global npm libraries
import React, { useState } from 'react'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'

const SERVER = process.env.REACT_APP_SERVER

function UploadStatus(props) {

  const { appData, sn } = props

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
  if(!checkFileHandle) {
    const fileStatusHandle = setInterval(() => checkFile({appData, sn}), 10000)
    setCheckFileHandle(fileStatusHandle)
  }

  return (
    <div style={{ padding: '25px' }}>
      {
        showStatusStr ? (
          <>
            {statusStr}
          </>
        ) : null
      }
    </div>
  )
}

// Called by a timer interval. This checks the status of the file upload.
async function checkFile ({appData, sn}) {
  try {
    const url = `${SERVER}/files/status/${sn}`

    const result = await axios.get(url)
    console.log('checkFile() result.data: ', result.data)

    const fileStatus = result.data.fileStatus

    if(fileStatus) {

      if(!fileStatus.uploadComplete) {
        // Show the status after file upload has started.
        appData.uploadStatus.setShowStatusStr(true)
      } else {
        const filename = fileStatus.originalFile.desiredFileName
        const url = `https://p2wdb-gateway-678.fullstack.cash/ipfs/${fileStatus.cid}/files/${filename}`

        const p2wdbUrl = `https://p2wdb.fullstack.cash/entry/hash/${fileStatus.p2wdbHash}`

        // Report details after pinning has completed.
        appData.uploadStatus.setStatusStr(
          <>
            <p>Upload complete!</p>
            <p>P2WDB hash: <a href={p2wdbUrl} target="_blank" rel="noreferrer">{fileStatus.p2wdbHash}</a></p>
            <p>IPFS CID: {fileStatus.cid}</p>
            <p>
              <a href={url} target="_blank" rel="noreferrer">{url}</a>
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

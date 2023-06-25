import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
  useState
} from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { Dashboard } from '@uppy/react'
import '@uppy/core/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
import '@uppy/status-bar/dist/style.css'
import '@uppy/dashboard/dist/style.css'

// const SERVER = process.env.REACT_APP_API_URL
const SERVER = 'http://localhost:5010'

const uppy = new Uppy({
  meta: { test: 'avatar' },
  allowMultipleUploads: true,
  debug: false,
  restrictions: {
    maxFileSize: null,
    maxNumberOfFiles: 2,
    minNumberOfFiles: 1,
    allowedFileTypes: ['image/*'] // type of files allowed to load
  },
  onBeforeUpload: (files) => {
    const updatedFiles = Object.assign({}, files)
    Object.keys(updatedFiles).forEach((fileId) => {
      const indexName = fileId.lastIndexOf('/')
      const fileName = fileId.substring(indexName, fileId.length)
      uppy.setFileMeta(fileId, { fileNameToEncrypt: fileName, resize: 1500 })
    })
    return updatedFiles
  }
})

uppy.use(Tus, { endpoint: `${SERVER}/files` })

uppy.on('complete', (result) => { })

// Uppy's Dashboard requires the <window.Object.hasOwn> property
// which some browsers do not support
// Replaced this property with <window.hasOwnProperty> so that the uppy dashboard
// can be used in different browsers.
if (!window.Object.hasOwn) {
  window.Object.hasOwn = window.hasOwnProperty
  console.warn('window.hasOwn is not supported in safari , its replace by hasOwnProperty ')
}
const UppyHandler = forwardRef((props, ref) => {
  const { onChange } = props
  const thumbnailAddedRef = useRef()
  const filePreviewRef = useRef()
  const [uppyFiles, setUppyFiles] = useState([])

  // this events calls one when the component is mounted
  const handleUppyEvents = useCallback(() => {
    if (uppyFiles.length > 0) return
    uppy.once('file-removed', (file, reason) => {
      // clean uppy on file removed
      setUppyFiles([])
      uppy.cancelAll()
      thumbnailAddedRef.current = false
      filePreviewRef.current = false
      onChange && onChange(null)
    })
    uppy.once('file-added', (file) => {
      onChange && onChange(file)

      const files = uppy.getFiles()
      setUppyFiles(files)

      // generate thumbnail and add to uppy if it does not exist
      if (files.length > 1) { return }
      const thumbnailGenerator = uppy.getPlugin('Dashboard:ThumbnailGenerator')
      const thumbnailWidth = 512
      const thumbnailHeight = 512
      thumbnailGenerator.createThumbnail(file, thumbnailWidth, thumbnailHeight).then(async (preview) => {
        const blob = await fetch(preview).then((r) => r.blob())
        filePreviewRef.current = blob
        // Add thumbnail file to uppy
        uppy.addFile({
          name: `thumbnail-${file.name}`, // file name
          type: file.data.type, // file type
          data: blob, // file blob
          meta: {
            isThumbnail: true
          }
        })
      }).catch(err => { console.log('Thumbnail error', err) })
    })
    // eslint-disable-next-line
  }, [uppyFiles])
  // listen uppy event once on component did mount
  // eslint-disable-next-line
  useEffect(handleUppyEvents, [uppyFiles])
  const submit = async () => {
    return new Promise((resolve, reject) => {
      try {
        // Start to upload files via uppy
        uppy
          .upload()
          .then(async (result) => {
            // console.info("Successful uploads:", result.successful)
            try {
              // Upload failed due to no file being selected.
              if (result.successful.length <= 0 && result.failed.length <= 0) {
                resolve(false)
                // throw new Error('File is required')
              } else if (result.failed.length > 0) {
                // Upload failed (for some other reason)

                // Error updload some file
                resolve(false)

                // throw new Error('Fail to upload Some Files')
              }
            } catch (error) {
              resolve(false)
            }
            resolve(true)
          })
          .catch((error) => {
            console.warn(error)
            resolve(false) // reject(new Error("File is required"))
          })
      } catch (error) {
        return reject(error)
      }
    })
  }

  const getFileExtension = (files) => {
    const data = []

    if (!files.length) {
      return
    }

    // Push only the first file reference
    // into payload meta property ( ignoring thumbnail )
    const value = files[0]
    if (value.extension) {
      data.push(value.extension)
    } else {
      data.push('unknow')
    }
    return data
  }

  useImperativeHandle(ref, () => ({
    async submitFiles () {
      const result = await submit()
      return result
    },
    hasLoadedFiles () {
      try {
        const files = uppy.getFiles()
        return files
      } catch (error) {
        return []
      }
    },
    getFileData () {
      const files = uppy.getFiles()
      const data = getFileExtension(files)
      return data
    },
    clearUppy () {
      const files = uppy.getFiles()
      if (files.length) {
        uppy.removeFile(files[0].id)
      }
    },
    getFilePreview () {
      return filePreviewRef.current
    },
    addFile (file, blob) {
      uppy.addFile(file)
    }
  }))

  return (
    <>
      {/** Some browsers like Safari do not contain the <window.Object.hasOwn> property
      * This causes the page to break, due to this we add this validation
      */}
      {window.Object.hasOwn && <Dashboard
        id='Dashboard'
        uppy={uppy}
        thumbnailWidth={512}
        thumbnailHeight={512}
        showLinkToFileUploadResult={false}
        hideUploadButton
        hideRetryButton={false}
        hidePauseResumeButton={false}
        hideCancelButton={false}
        hideProgressAfterFinish={false}
        disableStatusBar={false}
        autoOpenFileEditor
        disableInformer
        height={250}
        theme='dark'
        locale={{
          strings: {
            dropPasteFiles:
              'Drop your file here or %{browseFiles} (JPG,PNG,GIF)'
          }
        }}
                               />}
    </>
  )
})

export default UppyHandler

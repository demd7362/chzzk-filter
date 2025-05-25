function createInputRow(type, value = '') {
  const inputWrap = document.getElementById('input-wrap')

  const itemRow = document.createElement('div')
  itemRow.className = 'input-item-row'

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = type === 'streamer' ? '스트리머명을 입력하세요' : '태그명을 입력하세요'
  input.value = value

  const deleteButton = document.createElement('button')
  deleteButton.innerText = '삭제'
  deleteButton.className = 'delete-item-btn'

  deleteButton.addEventListener('click', function () {
    const currentInput = this.previousElementSibling
    const valueToRemove = currentInput.value
    itemRow.remove()

    const storageKey = type === 'streamer' ? 'streamerNames' : 'tags'
    chrome.storage.sync.get([storageKey], function (result) {
      const values = result[storageKey] || []
      const filtered = values.filter(item => item !== valueToRemove)
      chrome.storage.sync.set({ [storageKey]: filtered })
    })
  })

  itemRow.appendChild(input)
  itemRow.appendChild(deleteButton)
  inputWrap.appendChild(itemRow)

  input.addEventListener('input', saveInputs)
  return input
}


function handleClickAddButton() {
  createInputRow('streamer')
}
document.getElementById('add-btn').addEventListener('click', handleClickAddButton)

function handleClickTagAddButton() {
  createInputRow('tag')
}
document.getElementById('tag-add-btn').addEventListener('click', handleClickTagAddButton)


function exportSettings() {
  chrome.storage.sync.get(["streamerNames", "tags"], function (result) {
    const json = JSON.stringify(result, null, 2)
    const data = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(data)
    const a = document.createElement("a")
    a.href = url

    const date = new Date()
    const yyMMdd = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`

    a.download = `chzzk_filter_${yyMMdd}.json`
    a.click()

    URL.revokeObjectURL(url)
  })
}
document.getElementById("export").addEventListener("click", exportSettings)


function importSettings(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)
      const { streamerNames, tags } = data
      if (!Array.isArray(streamerNames) || !Array.isArray(tags)) {
        alert('파일 형식이 부적절합니다.')
        return
      }
      chrome.storage.sync.set({ streamerNames, tags }, () => {
        const inputWrap = document.getElementById('input-wrap')
        while (inputWrap.firstChild) {
          inputWrap.removeChild(inputWrap.firstChild)
        }
        loadInputs()
        alert('설정을 성공적으로 불러왔습니다.')
      })
    } catch (error) {
      alert('파일을 읽거나 처리하는 중 오류가 발생했습니다. 형식이 올바른지 확인해주세요.')
    }
  }
  reader.onerror = () => {
    alert('파일을 읽는데 실패했습니다.')
  }
  reader.readAsText(file)
  e.target.value = null
}
document.getElementById('import').addEventListener('change', importSettings)


function saveInputs() {
  const inputs = document.querySelectorAll('#input-wrap .input-item-row input[type="text"]')
  const streamerNames = []
  const tags = []

  inputs.forEach(input => {
    const value = input.value.trim()
    if (value === '') {
      return
    }
    if (input.placeholder === '태그명을 입력하세요') {
      tags.push(value)
    } else {
      streamerNames.push(value)
    }
  })
  chrome.storage.sync.set({ streamerNames, tags })
}


function loadInputs() {
  chrome.storage.sync.get(['streamerNames', 'tags'], (result) => {
    const inputWrap = document.getElementById('input-wrap')
    while (inputWrap.firstChild) {
      inputWrap.removeChild(inputWrap.firstChild)
    }

    const { streamerNames = [], tags = [] } = result

    streamerNames.forEach((value) => {
      createInputRow('streamer', value)
    })
    tags.forEach((value) => {
      createInputRow('tag', value)
    })
  })
}

document.addEventListener('DOMContentLoaded', loadInputs)

const delay = 12 / navigator.hardwareConcurrency * 200
console.log(`치지직 필터가 활성화되었습니다. 딜레이 ${delay}`)
console.log('https://github.com/demd7362/chzzk-filter')

document.querySelector('body').insertAdjacentHTML('beforeend', `
<div id="custom-context-menu" style="
    display: none; 
    position: absolute; 
    background-color: #282828; /* Dark gray, slightly lighter than pure black */
    border: 1px solid #4CAF50; /* Primary green border */
    border-radius: 6px; /* Softer corners */
    padding: 7px; /* Padding top/bottom, items will have horizontal padding */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5); /* More pronounced shadow */
    z-index: 2147483647; /* Max z-index to be on top */
    overflow: hidden; /* Ensures items with padding fit well with border-radius */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Consistent font */
">
</div>`)

// function getStorageData(keys) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.sync.get(keys, (result) => {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError)
//       } else {
//         resolve(result)
//       }
//     })
//   })
// }
//
// function setStorageData(key, value, callback) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.sync.set({[key]: value}, callback)
//   })
// }

// promise를 리턴하고 동기적으로 만들면 스트리밍을 받아오지 못함
function filterStreamers() {
  chrome.storage.sync.get(['streamerNames', 'tags','isActive'], (result) => {
    const isActive = result.isActive ?? true
    if(!isActive){
      return
    }
    const streamerNames = new Set(result.streamerNames || [])
    const tags = new Set(result.tags || [])
    document.querySelectorAll('li').forEach((node) => {
      const streamerName = node.querySelector('.name_text__yQG50')?.textContent
      if (streamerNames.has(streamerName)) {
        node.style.visibility = 'hidden'
      } else {
        const tagNodes = node.querySelectorAll('.video_card_category__xQ15T')
        if (tagNodes.length > 0) {
          const ownTags = Array.from(tagNodes).map(node => node.textContent)
          if (ownTags.some(tag => tags.has(tag))) {
            node.style.visibility = 'hidden'
          }
        }
      }
    })
  })
}

function handleFilterItem(value, type) {
  chrome.storage.sync.get(['streamerNames', 'tags'], (result) => {
    const {streamerNames = [], tags = []} = result
    switch (type) {
      case 'streamerName': {
        if (!streamerNames.includes(value)) {
          streamerNames.push(value)
          chrome.storage.sync.set({'streamerNames': streamerNames}, filterStreamers)
        }
        break
      }
      case 'tag': {
        if (!tags.includes(value)) {
          tags.push(value)
          chrome.storage.sync.set({'tags': tags}, filterStreamers)
        }
        break
      }
    }
    init()
  })
}

function handleCustomMenu(e) {
  // 스트리머명 먼저 조회
  const streamerName = this.querySelector('.name_text__yQG50')?.textContent
  if (!streamerName) {
    return
  }
  e.preventDefault()
  const customMenu = document.getElementById('custom-context-menu')
  customMenu.style.display = 'block'
  customMenu.style.left = `${e.pageX}px`
  customMenu.style.top = `${e.pageY}px`
  customMenu.innerHTML = ''

  const streamerBlockDiv = document.createElement('div')
  streamerBlockDiv.textContent = `${streamerName} 차단`
  streamerBlockDiv.style.color = 'green'
  streamerBlockDiv.style.cursor = 'pointer'
  streamerBlockDiv.style.fontFamily = 'Arial, sans-serif'
  streamerBlockDiv.style.fontSize = '14px'
  streamerBlockDiv.style.padding = '5px'; // 패딩 추가 (호버 시 더 보기 좋게)
  streamerBlockDiv.addEventListener('click', () => handleFilterItem(streamerName, 'streamerName'))

  // 호버 시 스타일
  streamerBlockDiv.addEventListener('mouseover', () => {
    streamerBlockDiv.style.backgroundColor = '#f0f0f0'
    streamerBlockDiv.style.color = '#ff0000'
  })
  streamerBlockDiv.addEventListener('mouseout', () => {
    streamerBlockDiv.style.backgroundColor = '' // 원래 배경색으로 복원
    streamerBlockDiv.style.color = 'green' // 원래 글자색으로 복원
  })

  customMenu.appendChild(streamerBlockDiv)

  // 태그 차단
  const tagNodes = this.querySelectorAll('.video_card_category__xQ15T')
  if (tagNodes.length > 0) {
    const ownTags = Array.from(tagNodes).map(node => node.textContent)
    for (const tag of ownTags) {
      const tagBlockDiv = document.createElement('div')
      tagBlockDiv.textContent = `${tag} 태그 차단`
      tagBlockDiv.style.color = 'green'
      tagBlockDiv.style.cursor = 'pointer'
      tagBlockDiv.style.fontFamily = 'Arial, sans-serif'
      tagBlockDiv.style.fontSize = '14px'
      tagBlockDiv.style.padding = '5px'; // 패딩 추가 (호버 시 더 보기 좋게)
      tagBlockDiv.addEventListener('click', () => handleFilterItem(tag, 'tag'))

      // 호버 시 스타일
      tagBlockDiv.addEventListener('mouseover', () => {
        tagBlockDiv.style.backgroundColor = '#f0f0f0'
        tagBlockDiv.style.color = '#ff0000'
      })
      tagBlockDiv.addEventListener('mouseout', () => {
        tagBlockDiv.style.backgroundColor = '' // 원래 배경색으로 복원
        tagBlockDiv.style.color = 'green' // 원래 글자색으로 복원
      })

      customMenu.appendChild(tagBlockDiv)
    }
  }
}

document.addEventListener('click', () => {
  const customMenu = document.getElementById('custom-context-menu')
  if (customMenu.style.display === 'block') {
    customMenu.style.display = 'none'
  }
})

function init() {
  setTimeout(() => {
    filterStreamers()
    hideNodes()
  }, delay)
}

init()

// https://chzzk.naver.com/lives에서 인기/최신/추천 탭 클릭 시 에러 -> node 삭제가 아니라 display none 처리
function hideNodes() {
  document.querySelectorAll('li').forEach(node => {
    if (node.style.visibility === 'hidden') { // inline css hidden 설정해놓은 노드
      node.style.display = 'none'
      node.style.visibility = 'visible'
    }
  })
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length && mutation.addedNodes[0].matches('li')) {
      // /lives 외에서는 제대로 작동하지않아 전체 li
      document.querySelectorAll('li').forEach((queryNode) => {
        queryNode.addEventListener('contextmenu', handleCustomMenu)
      })
      filterStreamers() // 새로운 <li>가 추가될 때마다 필터링 적용
      hideNodes()
    }
  })
})

// body 요소 감시
observer.observe(document.body, {childList: true, subtree: true})

document.getElementById('RECOMMEND').addEventListener('click', init)

export const css = 
`
<style>
    #custom-search-result {
        color: rgba(0, 0, 0, 0.87);
    }
    #custom-search-result a:hover {
        background: #eff1f1;
        color: #9c27b0;
    }
    
    /*#custom-search-result a {*/
    /*    padding: 5px;*/
    /*    border-radius: 4px;*/
    /*    text-decoration: none;*/
    /*    border: 1px solid #d3d3d3;*/
    /*    display: inline-block;*/
    /*    width: 90%;*/
    /*    vertical-align: middle;*/
    /*    color: rgba(0, 0, 0, 0.87);*/
    /*}*/
    
    .task-searcher-button:hover {
        background: #eff1f1 !important;
    }

    #custom-header-button:hover {
        background: #ffffff !important;
        color: black;
        transform: scale(1.1);
        transition: transform 0.1s;
    }

    #custom-header-button {
        position: fixed;
        bottom: 2rem;
        top: auto;
        right: 2rem;
        background: #eff1f1 !important;
        box-shadow: 0 7px 9px -4px #a8a8a8;
        z-index: 10000;
        transition: all 0.3s;
    }
      
    #custom-header-button:hover .openai-icon {
        transform: rotateZ(180deg);
    }
    
    .openai-icon {
        transform: rotateZ(0deg);
        transition: transform 0.5s;
    }
    
    .openai-loader {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      position: relative;
      animation: rotate 1s linear infinite
    }
    .openai-loader::before {
      content: "";
      box-sizing: border-box;
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 0.25rem solid rgb(156, 39, 176);
      animation: prixClipFix 2s linear infinite ;
    }
    
    #custom-search-close:hover {
        color: #757575;
    }
    
    #custom-search-close {
        background: none; 
        border: none;
        font-size: 36px;
        cursor: pointer;
        color: #9f9f9f;
        padding: 0;
        line-height: 1rem;
    }

    @keyframes rotate {
      100%   {transform: rotate(360deg)}
    }

    @keyframes prixClipFix {
        0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
        25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
        50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
        75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
        100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
    }
</style>`;

export const curtain = `
<div class="" id="search-curtain" style="
    position: fixed;
    top: 0;
    width: 100%;
    background: #0000005c;
    left: 0;);););););
    z-index: 70;
    bottom: 0;
    right: 0;
"></div>
`;

export const popupSearchBar = `
<div class="" id="popup-search-window" style="
    display: flex;
    position: fixed;
    top: 20vh;
    width: 50%;
    background: #fff;
    left: 25%;
    box-shadow: 0 10px 19px -11px #000;
    border-radius: 0.5rem;
    padding: 10px;
    min-width: 250px;
    z-index: 100;
">
    <input type="text" placeholder="Введите ваш запрос..." 
           id="ask-ai-input"
           class="v4-MuiInputBase-root v4-MuiOutlinedInput-root v5-v5294 v4-MuiInputBase-fullWidth v4-MuiInputBase-formControl v4-MuiInputBase-adornedStart v4-MuiOutlinedInput-adornedStart v5-v5295 v4-MuiInputBase-marginDense v4-MuiOutlinedInput-marginDense" 
           style="
           /* position: fixed; */
           padding: 10px;
           border: 1px solid rgb(204, 204, 204);
           border-radius: 8px;box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px;
           width: -webkit-fill-available;
           font-size: 16px;">
    <button id="popup-search-button" class="v5-v559 css-1hwqkh2">
        Search
    </button>
</div>
`

export const openAiIcon = `
<svg class="openai-icon" style="vertical-align: sub" fill="#000000" width="1rem" height="1rem" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
`


export const searchBarId = "ask-ai-input";
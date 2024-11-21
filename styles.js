export const css = 
`
<style>
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
      inset: 0px;
      border-radius: 50%;
      border: 0.25rem solid rgb(156, 39, 176);
      animation: prixClipFix 2s linear infinite ;
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
<div class="" style="
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
<div class="" style="
    position: fixed;
    top: 20vh;
    width: 50%;
    background: #fff;
    left: 25%;
    box-shadow: 0px 10px 19px -11px #000;
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
           font-size: 16px;">
</div>
`
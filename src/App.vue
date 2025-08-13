<script setup>
import Chatbox from './components/Chat.vue';
import history_element from './components/history_element.vue';
import * as webllm from "@mlc-ai/web-llm";
import 'material-icons/iconfont/material-icons.css';
</script>

<template>
   <header style="border-radius: 20px; border-width: 30; border-color:white ; border-style: solid; color: white; padding: 1rem;">
    <a>WEB - AI </a>
</header>

<body>
    <div style="display: flex; flex-direction: row;"> 
        <div class="card" style="overflow:scroll;scrollbar-width: none;  width:25vw; margin-right: 10px; height:80vh">
            <history_element Heading="Random" Subject="Random Chat"></history_element>
        </div>
        <div style="display: flex; flex-direction: column;">
        <div class="card" style="height:70vh; width:75vw"></div>
        <div class="input_card"  style="display: flex; flex-direction: row;">
        <input v-model="input" @keyup.enter="sendmsg" placeholder="Enter the message!" class="input"></input>
        <button style="border:none; background-color: #242424;;"><span class="material-icons">arrow_forward_ios</span></button>
        </div>
        <div style="width:100%"></div>
    </div>
    </div>


</body>



</template>



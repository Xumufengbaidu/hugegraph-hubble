/*
 * Copyright 2017 HugeGraph Authors
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to You under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

package com.baidu.hugegraph.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.options.HubbleOptions;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Configuration
public class AuthClientConfiguration {

    public static final String AUTH_CLIENT_NAME = "authClient";

    @Bean(AUTH_CLIENT_NAME)
    public HugeClient authClient(HugeConfig config) {
        String authUrl = config.get(HubbleOptions.AUTH_REMOTE_URL);
        String authGraph = config.get(HubbleOptions.AUTH_GRAPH_STORE);
        return HugeClient.builder(authUrl, authGraph).build();
    }
}
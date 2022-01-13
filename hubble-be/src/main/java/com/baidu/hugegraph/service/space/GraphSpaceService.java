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

package com.baidu.hugegraph.service.space;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import com.baidu.hugegraph.structure.space.GraphSpaceReq;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.metadata.IPage;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.structure.space.GraphSpace;
import com.baidu.hugegraph.util.PageUtil;

@Service
public class GraphSpaceService {
    public IPage<GraphSpace> list(HugeClient client, int pageNo,
                                  int pageSize) {
        List<GraphSpace> results = client.graphSpace().listGraphSpace();

        return PageUtil.page(results, pageNo, pageSize);
    }

    public IPage<GraphSpace> queryPage(HugeClient client, String query,
                                       int pageNo, int pageSize) {
        List<GraphSpace> results =
                client.graphSpace().listGraphSpace().stream()
                      .filter((s) -> s.getName().contains(query))
                      .sorted(Comparator.comparing(GraphSpace::getName))
                      .collect(Collectors.toList());

        return PageUtil.page(results, pageNo, pageSize);
    }

    public GraphSpace get(HugeClient authClient, String graphspace) {
        GraphSpace space = authClient.graphSpace().getGraphSpace(graphspace);
        if (space == null) {
            throw new InternalException("graphspace.get.{} Not Exits",
                                        graphspace);
        }
        return space;
    }

    public void delete(HugeClient authClient, String graphspace) {
        authClient.graphSpace()
                  .deleteGraphSpace(graphspace, "I'm sure to drop the graph space");
    }

    public Object create(HugeClient authClient, GraphSpaceReq graphSpaceReq) {
        return authClient.graphSpace().createGraphSpace(graphSpaceReq);
    }

    public GraphSpace update(HugeClient authClient, GraphSpaceReq graphSpaceReq) {
        return authClient.graphSpace().updateGraphSpace(graphSpaceReq);
    }
}
